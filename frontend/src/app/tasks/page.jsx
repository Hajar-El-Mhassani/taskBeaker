'use client';

import { useState, useEffect } from 'react';
import { get, post } from '@/lib/api';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    taskName: '',
    timeMode: 'days',
    amount: 5,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const response = await get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      await post('/tasks/generate', formData);
      setShowForm(false);
      setFormData({ taskName: '', timeMode: 'days', amount: 5 });
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  }

  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Task Plans</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              {showForm ? 'Cancel' : 'Create New Task'}
            </button>
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Create New Task Plan</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <label className="label">Task Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.taskName}
                    onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                    placeholder="e.g., Launch new website"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Time Mode</label>
                    <select
                      className="input-field"
                      value={formData.timeMode}
                      onChange={(e) => setFormData({ ...formData, timeMode: e.target.value })}
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Amount</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input-field"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary w-full"
                >
                  {creating ? 'Generating...' : 'Generate Task Plan'}
                </button>
              </form>
            </div>
          )}

          {/* Task List */}
          {loading ? (
            <p>Loading...</p>
          ) : tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(task => (
                <TaskCard key={task.taskId} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No task plans yet</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Create Your First Task
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
