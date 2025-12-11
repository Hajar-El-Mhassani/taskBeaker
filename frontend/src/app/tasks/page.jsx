'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { get, post } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    taskName: '',
    timeMode: 'days',
    amount: 5,
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      const response = await post('/tasks/generate', formData);
      const newTaskId = response.data?.taskId;
      
      setShowForm(false);
      setFormData({ taskName: '', timeMode: 'days', amount: 5, startDate: new Date().toISOString().split('T')[0], endDate: '' });
      
      // Redirect to task details page
      if (newTaskId) {
        router.push(`/tasks/${newTaskId}`);
      } else {
        await loadTasks();
      }
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  }

  const TaskCard = ({ task }) => {
    const completed = task.subtasks.filter(s => s.done).length;
    const total = task.subtasks.length;
    const progress = Math.round((completed / total) * 100);
    const isCompleted = completed === total;

    return (
      <div 
        onClick={() => router.push(`/tasks/${task.taskId}`)}
        className="bg-white rounded-xl shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group overflow-hidden"
      >
        <div className={`h-2 ${isCompleted ? 'bg-success-500' : 'bg-primary-500'}`} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
              {task.taskName}
            </h3>
            {isCompleted && <span className="text-2xl">✅</span>}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-gray-900">{completed}/{total} tasks</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${isCompleted ? 'bg-success-500' : 'bg-primary-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>⏱️</span>
                <span>{task.totalEstimatedTime}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>📅</span>
                <span>{task.timeMode === 'days' ? `${task.amount} days` : `${task.amount} hours`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Task Plans</h1>
              <p className="text-gray-600">Manage and track your AI-generated task plans</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                showForm 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {showForm ? '✕ Cancel' : '➕ Create New Task'}
            </button>
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-soft-lg p-8 mb-8 border-2 border-primary-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Task Plan</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-danger-50 border-l-4 border-danger-500 text-danger-700 px-4 py-3 rounded">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    value={formData.taskName}
                    onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                    placeholder="e.g., Launch new website, Write research paper, Plan wedding"
                  />
                  <p className="text-xs text-gray-500 mt-1">Give your task a clear, descriptive name</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When do you want to start?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Target completion date
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, timeMode: 'days' })}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          formData.timeMode === 'days'
                            ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📅 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, timeMode: 'hours' })}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          formData.timeMode === 'hours'
                            ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ⏰ Hours
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose time measurement
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {formData.timeMode === 'days' ? 'Number of Days' : 'Number of Hours'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={formData.timeMode === 'days' ? 365 : 1000}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Duration of the task
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-brand-50 to-primary-50 border border-brand-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900">
                    <strong>💡 Tip:</strong> AI will generate {formData.timeMode === 'days' ? `a ${formData.amount}-day` : `a ${formData.amount}-hour`} plan starting on {new Date(formData.startDate).toLocaleDateString()}
                    {formData.endDate && ` and ending on ${new Date(formData.endDate).toLocaleDateString()}`} with 3-10 subtasks, 
                    organized by priority and estimated duration.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-brand-500 to-primary-600 text-white hover:from-brand-600 hover:to-primary-700 font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating AI Plan...</span>
                    </span>
                  ) : (
                    '🚀 Generate Task Plan with AI'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Task List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading my tasks...</p>
              </div>
            </div>
          ) : tasks.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Tasks ({tasks.length})</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Sort by:</span>
                  <select className="border border-gray-300 rounded-lg px-3 py-1">
                    <option>Recent</option>
                    <option>Progress</option>
                    <option>Name</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                  <TaskCard key={task.taskId} task={task} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">📋</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No task plans yet</h3>
              <p className="text-gray-600 mb-6">Create your first AI-powered task plan to get started</p>
              <button 
                onClick={() => setShowForm(true)} 
                className="bg-primary-600 text-white hover:bg-primary-700 font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                ➕ Create Your First Task
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
