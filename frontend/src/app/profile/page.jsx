'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { patch, uploadFile } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    maxHoursPerDay: 8,
    workDays: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
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
    setMessage('');
    setLoading(true);

    try {
      await patch('/auth/profile', {
        name: formData.name,
        preferences: {
          maxHoursPerDay: formData.maxHoursPerDay,
          workDays: formData.workDays,
        },
      });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setMessage('');
    setLoading(true);

    try {
      await uploadFile('/auth/avatar', file, 'avatar');
      setMessage('Avatar uploaded successfully!');
      window.location.reload();
    } catch (error) {
      setMessage('Failed to upload avatar');
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
            <h2 className="text-xl font-semibold mb-4">Avatar</h2>
            <div className="flex items-center space-x-4">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Max 5MB (PNG, JPG, GIF)</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field bg-gray-100"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="label">Maximum Hours Per Day</label>
              <input
                type="number"
                min="1"
                max="24"
                className="input-field"
                value={formData.maxHoursPerDay}
                onChange={(e) => setFormData({ ...formData, maxHoursPerDay: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="label">Work Days</label>
              <div className="grid grid-cols-2 gap-2">
                {allDays.map(day => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.workDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
