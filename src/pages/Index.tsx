import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import Dashboard from '../screens/Dashboard';
import Ponds from '../screens/Ponds';
import AddExpense from '../screens/AddExpense';
import Reports from '../screens/Reports';
import Transactions from '../screens/Transactions';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateToTransactions={() => setActiveTab('transactions')} />;
      case 'ponds':
        return <Ponds />;
      case 'add-expense':
        return <AddExpense />;
      case 'reports':
        return <Reports />;
      case 'transactions':
        return <Transactions />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen">
        {renderActiveScreen()}
      </div>
      
      {/* Bottom Navigation */}
      <div className="max-w-md mx-auto">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
