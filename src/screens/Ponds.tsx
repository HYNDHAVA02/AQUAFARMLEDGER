import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePonds, useCreatePond, useUpdatePond, useDeletePond } from '@/hooks/usePonds';
import { type Pond } from '@/services/supabase';
import PondCard from '../components/PondCard';

// Move AddPondModal outside of Ponds
interface AddPondModalProps {
  show: boolean;
  onClose: () => void;
  editingPond: Pond | null;
  createPond: ReturnType<typeof useCreatePond>;
  updatePond: ReturnType<typeof useUpdatePond>;
  setEditingPond: (pond: Pond | null) => void;
}

const AddPondModal: React.FC<AddPondModalProps> = ({ show, onClose, editingPond, createPond, updatePond, setEditingPond }) => {
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    location: '',
    lease_amount: '',
    monthly_expense_budget: ''
  });
  // Only reset form when modal is opened
  React.useEffect(() => {
    if (show) {
      if (editingPond) {
        setFormData({
          name: editingPond.name || '',
          size: editingPond.size?.toString() || '',
          location: editingPond.location || '',
          lease_amount: editingPond.lease_amount?.toString() || '',
          monthly_expense_budget: editingPond.monthly_expense_budget?.toString() || ''
        });
      } else {
        setFormData({
          name: '',
          size: '',
          location: '',
          lease_amount: '',
          monthly_expense_budget: ''
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.size.trim() || !formData.location.trim() || !formData.lease_amount.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    const sizeNum = parseFloat(formData.size);
    const leaseNum = parseInt(formData.lease_amount);
    const budgetNum = parseInt(formData.monthly_expense_budget) || 0;
    if (isNaN(sizeNum) || isNaN(leaseNum)) {
      alert('Please enter valid numbers for size and lease amount');
      return;
    }
    try {
      const pondData = {
        name: formData.name.trim(),
        size: sizeNum,
        location: formData.location.trim(),
        lease_amount: leaseNum,
        monthly_expense_budget: budgetNum
      };
      if (editingPond) {
        await updatePond.mutateAsync({ id: editingPond.id, updates: pondData });
      } else {
        await createPond.mutateAsync(pondData);
      }
      onClose();
      setEditingPond(null);
    } catch (error: any) {
      alert(`Failed to save pond: ${error.message || 'Unknown error'}`);
    }
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingPond ? 'Edit Pond' : 'Add New Pond'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Pond Name *
              </label>
              <input
                type="text"
                placeholder="Enter pond name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Size (acres) *
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Enter size in acres"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Location *
              </label>
              <input
                type="text"
                placeholder="Enter location"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Lease Amount (₹) *
              </label>
              <input
                type="number"
                placeholder="Enter lease amount"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.lease_amount}
                onChange={(e) => handleInputChange('lease_amount', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Monthly Budget (₹)
              </label>
              <input
                type="number"
                placeholder="Enter monthly expense budget"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.monthly_expense_budget}
                onChange={(e) => handleInputChange('monthly_expense_budget', e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                onClose();
                setEditingPond(null);
              }}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={createPond.isPending || updatePond.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={createPond.isPending || updatePond.isPending}
            >
              {createPond.isPending || updatePond.isPending 
                ? 'Saving...' 
                : editingPond ? 'Update' : 'Save'}
            </button>
            {(createPond.isPending || updatePond.isPending) && (
              <button
                onClick={() => {
                  onClose();
                  setEditingPond(null);
                }}
                className="mt-2 w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancel Operation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Ponds: React.FC = () => {
  const { data: ponds = [], isLoading } = usePonds();
  const createPond = useCreatePond();
  const updatePond = useUpdatePond();
  const deletePond = useDeletePond();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPond, setEditingPond] = useState<Pond | null>(null);

  const handleAddPond = () => {
    setEditingPond(null);
    setShowAddModal(true);
  };

  const handleEditPond = (pond: any) => {
    setEditingPond(pond);
    setShowAddModal(true);
  };

  const handleDeletePond = async (pond: any) => {
    if (confirm(`Are you sure you want to delete "${pond.name}"? This will also delete all expenses for this pond.`)) {
      try {
        await deletePond.mutateAsync(pond.id);
      } catch (error: any) {
        alert(`Failed to delete pond: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 pt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Ponds</h1>
          <button
            onClick={handleAddPond}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Pond
          </button>
        </div>
      </div>
      <div className="p-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{ponds.length}</div>
            <div className="text-gray-600 text-sm">Total Ponds</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {ponds.reduce((sum, pond) => sum + pond.size, 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Acres</div>
          </div>
        </div>
        {/* Pond Cards Grid */}
        <div className="space-y-4">
          {ponds.map((pond) => (
            <PondCard 
              key={pond.id} 
              pond={pond} 
              onEdit={handleEditPond}
              onDelete={handleDeletePond}
            />
          ))}
        </div>
      </div>
      <AddPondModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        editingPond={editingPond}
        createPond={createPond}
        updatePond={updatePond}
        setEditingPond={setEditingPond}
      />
    </div>
  );
};

export default Ponds;
