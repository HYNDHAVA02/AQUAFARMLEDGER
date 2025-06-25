import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip, Legend } from 'recharts';
import { useExpenses, useMonthlyExpenseTrend, useCategoryBreakdown } from '@/hooks/useExpenses';
import { usePonds } from '@/hooks/usePonds';

const Reports: React.FC = () => {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: ponds = [] } = usePonds();
  const { data: monthlyTrend = [] } = useMonthlyExpenseTrend();
  const { data: categoryBreakdown = [] } = useCategoryBreakdown();
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Custom Y-axis tick formatter for Indian currency
  const formatYAxisTick = (value: number) => {
    // Always show rupee symbol at the start, and avoid overlap by shortening large values
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(2)} K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  if (expensesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerPond = ponds.length > 0 ? Math.round(totalExpenses / ponds.length) : 0;
  const topCategory = categoryBreakdown.length > 0 
    ? categoryBreakdown.reduce((max, cat) => cat.value > max.value ? cat : max, categoryBreakdown[0])?.name || "N/A"
    : "N/A";

  const COLORS = ['#2196F3', '#009688', '#4CAF50', '#FF9800', '#9C27B0'];
  const POND_COLORS = ['#2196F3', '#009688', '#4CAF50'];

  // --- Stacked Bar Chart Data Transformation ---
  // Get all unique categories
  const categories = Array.from(new Set(expenses.map(e => e.category_name)));
  // Get all unique ponds
  const pondNames = Array.from(new Set(expenses.map(e => e.pond_name)));
  // Build data for the chart
  const pondCategoryData = pondNames.map(pond => {
    const pondExpenses = expenses.filter(e => e.pond_name === pond);
    const data: Record<string, any> = { pond };
    categories.forEach(cat => {
      data[cat] = pondExpenses.filter(e => e.category_name === cat).reduce((sum, e) => sum + e.amount, 0);
    });
    return data;
  });
  const CATEGORY_COLORS = [
    '#2196F3', '#009688', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#795548', '#607D8B', '#FFC107', '#8BC34A'
  ];

  // --- Pondwise Monthly Trend Data Transformation ---
  // Get all unique months in the data (with year)
  const allMonths = Array.from(new Set(expenses.map(e => {
    const d = new Date(e.date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  })));
  // Build data: [{ month: 'May 2024', Pond1: 1000, Pond2: 2000, ... }]
  const pondStackedData = allMonths.map(monthLabel => {
    const [monthStr, yearStr] = monthLabel.split(' ');
    const monthIdx = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
    const year = parseInt(yearStr, 10);
    const data = { month: monthLabel };
    ponds.forEach((pond) => {
      data[pond.name] = expenses
        .filter(e => {
          const d = new Date(e.date);
          return (
            e.pond_name === pond.name &&
            d.getMonth() === monthIdx &&
            d.getFullYear() === year
          );
        })
        .reduce((sum, e) => sum + e.amount, 0);
    });
    return data;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 pt-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }} className="font-bold text-blue-600">{formatAmount(totalExpenses)}</div>
                <div className="text-gray-600 text-sm">Total Expenses</div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }} className="font-bold text-green-600">{formatAmount(averagePerPond)}</div>
                <div className="text-gray-600 text-sm">Average/Pond</div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }} className="font-semibold text-orange-600">{topCategory}</div>
                <div className="text-gray-600 text-xs">Top Category</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pondwise Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pondwise Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pondStackedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatYAxisTick} />
                <Tooltip formatter={value => formatAmount(value)} />
                <Legend />
                {ponds.map((pond, idx) => (
                  <Bar key={pond.name} dataKey={pond.name} stackId="a" fill={POND_COLORS[idx % POND_COLORS.length]} name={pond.name} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {ponds.map((pond, index) => (
              <div key={pond.id} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: POND_COLORS[index % POND_COLORS.length] }}
                ></div>
                <span className="text-sm text-gray-700">{pond.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatYAxisTick} />
                <Tooltip formatter={value => formatAmount(value)} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#2196F3" 
                  strokeWidth={3}
                  dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatAmount(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category-wise Pond Expenses (Stacked Bar Chart) */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category-wise Pond Expenses</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pondCategoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pond" />
                <YAxis tickFormatter={formatYAxisTick} />
                <Tooltip formatter={value => formatAmount(value)} />
                <Legend />
                {categories.map((cat, idx) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Export Button */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <button className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            Export Report as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
