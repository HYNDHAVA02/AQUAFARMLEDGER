import React, { useState, useEffect } from 'react';
import { Edit2, Bell, Download, LogOut, Settings, Camera, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/components/AuthProvider';
import { usePonds } from '@/hooks/usePonds';
import { useExpenses } from '@/hooks/useExpenses';

interface ProfileProps {
  onBack?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const { profile, user, signOut, updateProfile, loading } = useAuthContext();
  const { data: ponds = [] } = usePonds();
  const { data: expenses = [] } = useExpenses();

  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    farm_name: profile?.farm_name || '',
    phone: profile?.phone || '',
    location: profile?.location || ''
  });

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        farm_name: profile.farm_name || '',
        phone: profile.phone || '',
        location: profile.location || ''
      });
    }
  }, [profile]);

  // Force refresh profile if it's missing
  useEffect(() => {
    if (!loading && !profile && user) {
      // Trigger a manual profile fetch by calling updateProfile with empty object
      updateProfile({}).catch((error) => {
        console.log('Profile refresh failed, likely due to invalid session:', error);
      });
    }
  }, [loading, profile, user, updateProfile]);

  // Show loading if profile is still being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        console.log('Profile: Starting logout...')
        await signOut();
        console.log('Profile: Logout completed')
      } catch (error: any) {
        console.error('Profile: Logout failed:', error)
        
        // Don't show error for session already missing (expected scenario)
        if (error.message?.includes('Auth session missing') || 
            error.name === 'AuthSessionMissingError') {
          console.log('Profile: Session was already invalid, logout completed')
        } else {
          // Show user-friendly error message for other errors
          alert('Logout failed. Please try again or refresh the page.')
        }
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 pt-8">
        <div className="flex items-center mb-2">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-3 p-1 hover:bg-blue-500 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
        <p className="text-blue-100 mt-1">Manage your account settings</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Camera size={16} className="text-white" />
              </button>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full text-xl font-bold text-gray-900 border rounded px-2 py-1"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full text-gray-600 border rounded px-2 py-1"
                    placeholder="Phone Number"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'No name set'}</h2>
                  <p
                    className="text-gray-600 break-all md:truncate md:w-full"
                    title={profile?.email || user?.email || ''}
                  >
                    {profile?.email || user?.email}
                  </p>
                  <p
                    className="text-gray-600 break-all md:truncate md:w-full"
                    title={profile?.phone || 'No phone set'}
                  >
                    {profile?.phone || 'No phone set'}
                  </p>
                </>
              )}
            </div>
            {isEditing ? (
              <div className="flex space-x-2">
                <button 
                  onClick={handleSaveProfile}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Save
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Edit2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Farm Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Farm Details</h3>
            {isEditing && (
              <span className="text-sm text-blue-600">Editing mode</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  value={editForm.farm_name}
                  onChange={(e) => setEditForm({...editForm, farm_name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter farm name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter location"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Farm Name:</span>
                <span className="ml-2 font-medium">{profile?.farm_name || 'Not set'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{profile?.location || 'Not set'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Member Since:</span>
                <span className="ml-2 font-medium">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{ponds.length}</div>
            <div className="text-gray-600 text-sm">Active Ponds</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{expenses.length}</div>
            <div className="text-gray-600 text-sm">Total Expenses</div>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">App Settings</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Currency Setting */}
            <div className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-900">Currency</div>
                <div className="text-sm text-gray-600">Choose your preferred currency</div>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Bell size={20} className="text-gray-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Notifications</div>
                  <div className="text-sm text-gray-600">Get expense reminders</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            <button className="w-full p-4 flex items-center text-left hover:bg-gray-50 transition-colors">
              <Download size={20} className="text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Export Data</div>
                <div className="text-sm text-gray-600">Download your expense data</div>
              </div>
            </button>

            <button className="w-full p-4 flex items-center text-left hover:bg-gray-50 transition-colors">
              <Settings size={20} className="text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Backup & Sync</div>
                <div className="text-sm text-gray-600">Manage data backup settings</div>
              </div>
            </button>
          </div>
        </div>

        {/* Support & About */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Support & About</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            <button className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Help & Support</div>
              <div className="text-sm text-gray-600">Get help with the app</div>
            </button>

            <button className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Privacy Policy</div>
              <div className="text-sm text-gray-600">Read our privacy policy</div>
            </button>

            <button className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">About</div>
              <div className="text-sm text-gray-600">App version 1.0.0</div>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
