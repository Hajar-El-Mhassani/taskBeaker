'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { patch, uploadFile } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    maxHoursPerDay: 8,
    workDays: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    if (user) {
      setLocalUser(user);
      setFormData({
        name: user.name || '',
        maxHoursPerDay: user.preferences?.maxHoursPerDay || 8,
        workDays: user.preferences?.workDays || [],
      });
    }
  }, [user]);

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day],
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('💾 Saving changes...');
    setLoading(true);

    try {
      console.log('Updating profile with:', {
        name: formData.name,
        preferences: {
          maxHoursPerDay: formData.maxHoursPerDay,
          workDays: formData.workDays,
        },
      });

      const response = await patch('/auth/profile', {
        name: formData.name,
        preferences: {
          maxHoursPerDay: formData.maxHoursPerDay,
          workDays: formData.workDays,
        },
      });
      
      console.log('Profile update response:', response);
      
      // Update local user state with the response
      if (response.data) {
        setLocalUser(response.data);
        // Also update the global user context
        updateUser(response.data);
        setMessage('✅ Profile updated successfully!');
      } else {
        setMessage('⚠️ Update completed but no data returned');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      let errorMessage = 'Failed to update profile';
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorMessage = '❌ Cannot connect to server. Backend might not be deployed or not responding.';
      } else if (error.status === 401) {
        errorMessage = '❌ Authentication failed. Please log in again.';
      } else if (error.message) {
        errorMessage = '❌ ' + error.message;
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.type, file.size);

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('❌ Only image files are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    setMessage('📤 Uploading image...');
    setLoading(true);

    try {
      console.log('Uploading to /auth/avatar...');
      const response = await uploadFile('/auth/avatar', file, 'avatar');
      console.log('Upload response:', response);
      
      // Update local user state with new avatar URL
      if (response.data?.avatarUrl) {
        const updatedUser = { ...localUser, avatarUrl: response.data.avatarUrl };
        console.log('Updated user with avatar:', updatedUser.avatarUrl);
        setLocalUser(updatedUser);
        // Also update the global user context
        updateUser(updatedUser);
        setMessage('✅ Avatar uploaded successfully!');
      } else {
        setMessage('⚠️ Upload completed but no avatar URL returned');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      let errorMessage = 'Failed to upload avatar';
      if (error.message.includes('fetch')) {
        errorMessage = '❌ Cannot connect to server. Backend might not be deployed.';
      } else if (error.status === 401) {
        errorMessage = '❌ Authentication failed. Please log in again.';
      } else if (error.status === 413) {
        errorMessage = '❌ File too large. Maximum size is 5MB.';
      } else if (error.message) {
        errorMessage = '❌ ' + error.message;
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded ${
              message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Avatar */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {localUser?.avatarUrl ? (
                  <img 
                    src={localUser.avatarUrl} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-brand-200" 
                    key={localUser.avatarUrl}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-brand-500 to-primary-600 flex items-center justify-center border-4 border-brand-200">
                    <span className="text-3xl text-white font-bold">{localUser?.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="bg-gradient-to-r from-brand-500 to-primary-600 text-white hover:from-brand-600 hover:to-primary-700 font-medium py-2 px-4 rounded-lg transition-all inline-block">
                    {loading ? 'Uploading...' : '📷 Choose Photo'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Max 5MB • PNG, JPG, GIF, WebP</p>
                <p className="text-xs text-gray-400 mt-1">Your photo will appear in the navbar</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                value={localUser?.email || ''}
                disabled
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Hours Per Day</label>
              <input
                type="number"
                min="1"
                max="24"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                value={formData.maxHoursPerDay}
                onChange={(e) => setFormData({ ...formData, maxHoursPerDay: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Days</label>
              <div className="grid grid-cols-2 gap-2">
                {allDays.map(day => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.workDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:from-brand-600 hover:to-primary-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
