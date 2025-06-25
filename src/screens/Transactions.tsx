import React, { useState } from 'react';
import { Search, Filter, Calendar, ChevronDown } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { useDeleteExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { usePonds } from '@/hooks/usePonds';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import ExpenseCard from '../components/ExpenseCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';

const Transactions: React.FC = () => {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: ponds = [] } = usePonds();
  const { data: categories = [] } = useExpenseCategories();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [showFilters, setShowFilters] = useState(false);
  const [selectedPond, setSelectedPond] = useState('All Ponds');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [sortOrder, setSortOrder] = useState('newest');

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (expensesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Filter and sort transactions
  const filteredTransactions = expenses
    .filter(expense => {
      const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.pond_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPond = selectedPond === 'All Ponds' || expense.pond_name === selectedPond;
      const matchesCategory = selectedCategory === 'All Categories' || expense.category_name === selectedCategory;
      
      return matchesSearch && matchesPond && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortOrder === 'highest') {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });

  const totalAmount = filteredTransactions.reduce((sum, expense) => sum + expense.amount, 0);

  const handleDeleteExpense = async (expense: any) => {
    if (window.confirm(`Are you sure you want to delete this ${expense.category_name} expense?`)) {
      try {
        await deleteExpense.mutateAsync(expense.id);
      } catch (error) {
        alert('Failed to delete expense. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 pt-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-blue-600 font-medium"
          >
            <Filter size={20} className="mr-1" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={selectedPond} 
                onChange={(e) => setSelectedPond(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option>All Ponds</option>
                {ponds.map((pond) => (
                  <option key={pond.id} value={pond.name}>
                    {pond.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option>All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option>All Time</option>
                <option>This Month</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
                <option>This Year</option>
              </select>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</div>
              <div className="text-gray-600 text-sm">Total Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatAmount(totalAmount)}</div>
              <div className="text-gray-600 text-sm">Total Amount</div>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Transaction History ({filteredTransactions.length})
            </h3>
          </div>
          
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} onDelete={handleDeleteExpense} onEdit={handleEditExpense} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No transactions found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(selectedPond !== 'All Ponds' || selectedCategory !== 'All Categories' || searchTerm !== '' || selectedPeriod !== 'All Time') && (
          <button
            onClick={() => {
              setSelectedPond('All Ponds');
              setSelectedCategory('All Categories');
              setSearchTerm('');
              setSelectedPeriod('All Time');
            }}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        )}
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

export default Transactions;
