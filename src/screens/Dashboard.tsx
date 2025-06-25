import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, User } from 'lucide-react';
import { useExpenses, useCategoryBreakdown, useDeleteExpense } from '@/hooks/useExpenses';
import { usePonds } from '@/hooks/usePonds';
import { useAuthContext } from '@/components/AuthProvider';
import ExpenseCard from '../components/ExpenseCard';
import Profile from './Profile';

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
            {ponds.map((pond) => (
              <div key={pond.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-900">{pond.name}</h4>
                  <p className="text-gray-600 text-sm">{pond.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{formatAmount(pond.monthly_expense_budget)}</p>
                  <div className="flex items-center text-green-500 text-sm">
                    <TrendingUp size={14} className="mr-1" />
                    <span>12%</span>
                  </div>
                </div>
              </div>
            ))}
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
              <ExpenseCard key={expense.id} expense={expense} onDelete={handleDeleteExpense} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
