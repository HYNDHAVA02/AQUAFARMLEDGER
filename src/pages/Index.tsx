import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import Dashboard from '../screens/Dashboard';
import Ponds from '../screens/Ponds';
import AddExpense from '../screens/AddExpense';
import Reports from '../screens/Reports';
import Transactions from '../screens/Transactions';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);

  const handleAddExpenseForPond = (pondId: string) => {
    setSelectedPondId(pondId);
    setActiveTab('add-expense');
  };

  const handleTabChange = (tab: string) => {
    if (tab !== 'add-expense') {
      setSelectedPondId(null);
    }
    setActiveTab(tab);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateToTransactions={() => setActiveTab('transactions')} onAddExpenseForPond={handleAddExpenseForPond} />;
      case 'ponds':
        return <Ponds />;
      case 'add-expense':
        return <AddExpense selectedPondId={selectedPondId} />;
      case 'reports':
        return <Reports />;
      case 'transactions':
        return <Transactions />;
      default:
        return <Dashboard onAddExpenseForPond={handleAddExpenseForPond} />;
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
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default Index;
