import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, User } from 'lucide-react';
import { useExpenses, useCategoryBreakdown, useDeleteExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { usePonds } from '@/hooks/usePonds';
import { useAuthContext } from '@/components/AuthProvider';
import ExpenseCard from '../components/ExpenseCard';
import Profile from './Profile';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';

// Add prop for navigation
interface DashboardProps {
  onNavigateToTransactions?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTransactions }) => {
  const [showProfile, setShowProfile] = useState(false);
  const { profile } = useAuthContext();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: ponds = [], isLoading: pondsLoading } = usePonds();
  const { data: categoryData = [] } = useCategoryBreakdown();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const { data: categories = [] } = useExpenseCategories();
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate current month expenses with memoization
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [currentMonthExpenses]);

  // Calculate monthly budget from all ponds
  const totalMonthlyBudget = useMemo(() => {
    return ponds.reduce((sum, pond) => sum + (pond.monthly_expense_budget || 0), 0);
  }, [ponds]);

  // Calculate budget usage percentage
  const budgetUsagePercentage = useMemo(() => {
    if (totalMonthlyBudget === 0) return 0;
    return Math.min((totalExpenses / totalMonthlyBudget) * 100, 100);
  }, [totalExpenses, totalMonthlyBudget]);

  // Calculate last month expenses for comparison
  const lastMonthExpenses = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= lastMonth && expenseDate <= lastMonthEnd;
    }).reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const percentageChange = lastMonthExpenses > 0 
    ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1)
    : totalExpenses > 0 ? '100' : '0';
  const isIncrease = totalExpenses > lastMonthExpenses;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);
  const activePonds = ponds.length;
  const mostExpensiveCategory = useMemo(() => {
    return categoryData.length > 0 
      ? categoryData.reduce((max, cat) => cat.value > max.value ? cat : max, categoryData[0])?.name || "N/A"
      : "N/A";
  }, [categoryData]);
  const lastExpenseDate = useMemo(() => {
    return expenses.length > 0
      ? new Date(expenses[0].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      : 'N/A';
  }, [expenses]);

  const handleDeleteExpense = async (expense: any) => {
    if (confirm(`Are you sure you want to delete this ${expense.category_name} expense?`)) {
      try {
        await deleteExpense.mutateAsync(expense.id);
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert(`Failed to delete expense: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setEditForm({
      ...expense,
      date: expense.date?.split('T')[0] || '',
    });
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateExpense.mutateAsync({ id: editingExpense.id, updates: {
        pond_id: ponds.find(p => p.name === editForm.pond_name)?.id,
        category_id: categories.find(c => c.name === editForm.category_name)?.id,
        amount: Number(editForm.amount),
        date: editForm.date,
        description: editForm.description,
      }});
      setEditingExpense(null);
    } catch (error) {
      alert('Failed to update expense. Please try again.');
    }
  };

  if (expensesLoading || pondsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (showProfile) {
    return <Profile onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 pt-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!</h1>
            <p className="text-blue-100 mt-1">{profile?.farm_name || currentMonth}</p>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"
          >
            <User size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Monthly Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Total Expenses This Month</h2>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatAmount(totalExpenses)}
              </p>
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isIncrease ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {isIncrease ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
              {percentageChange}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                budgetUsagePercentage > 90 ? 'bg-red-500' : 
                budgetUsagePercentage > 75 ? 'bg-yellow-500' : 'bg-blue-600'
              }`}
              style={{width: `${budgetUsagePercentage}%`}}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-gray-500 text-sm">
              {budgetUsagePercentage.toFixed(1)}% of monthly budget used
            </p>
            <p className="text-gray-600 text-sm font-medium">
              Budget: {formatAmount(totalMonthlyBudget)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{activePonds}</div>
            <div className="text-gray-600 text-sm">Active Ponds</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-sm font-semibold text-orange-600">{mostExpensiveCategory}</div>
            <div className="text-gray-600 text-xs">Top Category</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-sm font-semibold text-green-600">{lastExpenseDate}</div>
            <div className="text-gray-600 text-xs">Last Expense</div>
          </div>
        </div>

        {/* Pond Overview Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pond Overview</h3>
          <div className="space-y-3">
            {ponds.map((pond) => {
              const pondTotalExpense = expenses
                .filter(exp => exp.pond_name === pond.name)
                .reduce((sum, exp) => sum + exp.amount, 0);
              return (
                <div key={pond.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900">{pond.name}</h4>
                    <p className="text-gray-600 text-sm">{pond.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatAmount(pondTotalExpense)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Expenses */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            <button
              className="text-blue-600 font-medium text-sm"
              onClick={onNavigateToTransactions}
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} onDelete={handleDeleteExpense} onEdit={handleEditExpense} />
            ))}
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      <Dialog open={!!editingExpense} onOpenChange={open => { if (!open) setEditingExpense(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Pond</Label>
              <Select value={editForm.pond_name} onValueChange={val => handleEditFormChange('pond_name', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pond" />
                </SelectTrigger>
                <SelectContent>
                  {ponds.map(pond => (
                    <SelectItem key={pond.id} value={pond.name}>{pond.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={editForm.category_name} onValueChange={val => handleEditFormChange('category_name', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={editForm.amount} onChange={e => handleEditFormChange('amount', e.target.value)} required />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={editForm.date} onChange={e => handleEditFormChange('date', e.target.value)} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={editForm.description} onChange={e => handleEditFormChange('description', e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingExpense(null)}>Cancel</Button>
              <Button type="submit" disabled={updateExpense.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
