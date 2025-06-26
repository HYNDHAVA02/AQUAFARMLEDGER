import React, { useState, useEffect } from 'react';
import { Calendar, Check } from 'lucide-react';
import { usePonds } from '@/hooks/usePonds';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useCreateExpense } from '@/hooks/useExpenses';

interface AddExpenseProps {
  selectedPondId?: string | null;
}

const AddExpense: React.FC<AddExpenseProps> = ({ selectedPondId }) => {
  const { data: ponds = [], isLoading: pondsLoading } = usePonds();
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories();
  const createExpense = useCreateExpense();
  
  const [selectedPond, setSelectedPond] = useState(selectedPondId || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (selectedPondId) {
      setSelectedPond(selectedPondId);
    }
  }, [selectedPondId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPond || !selectedCategory || !amount) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      await createExpense.mutateAsync({
        pond_id: selectedPond,
        category_id: selectedCategory,
        amount: parseInt(amount),
        date,
        description: description || 'No description'
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setSelectedPond('');
        setSelectedCategory('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
      }, 2000);
    } catch (error) {
      alert('Failed to add expense. Please try again.');
    }
  };

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue) {
      return new Intl.NumberFormat('en-IN').format(parseInt(numericValue));
    }
    return '';
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setAmount(value);
  };

  if (pondsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Expense Added!</h2>
          <p className="text-gray-600">Your expense has been recorded successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 pt-8">
        <h1 className="text-2xl font-bold">Add Expense</h1>
        <p className="text-blue-100 mt-1">Record your pond expenses</p>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pond Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Select Pond <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPond}
              onChange={(e) => setSelectedPond(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Choose a pond...</option>
              {ponds.map((pond) => (
                <option key={pond.id} value={pond.id}>
                  {pond.name} - {pond.location}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Expense Category <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Choose category...</option>
              <optgroup label="Recurring Expenses">
                {categories.filter(cat => cat.is_recurring).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="One-time Expenses">
                {categories.filter(cat => !cat.is_recurring).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">₹</span>
              <input
                type="text"
                value={formatAmount(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full p-4 pl-12 border border-gray-300 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 pl-12 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                type="button"
                onClick={() => setDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDate(yesterday.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note about this expense..."
              rows={3}
              className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              className="flex-1 py-4 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium text-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExpense.isPending}
              className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createExpense.isPending ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
