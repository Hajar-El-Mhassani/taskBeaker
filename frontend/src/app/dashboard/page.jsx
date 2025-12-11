'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { get } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0 });
  const [todaySubtasks, setTodaySubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const response = await get('/tasks');
      const allTasks = response.data.tasks || [];
      setTasks(allTasks);

      // Calculate stats
      const total = allTasks.length;
      const completed = allTasks.filter(t => 
        t.subtasks.every(s => s.done)
      ).length;
      const inProgress = allTasks.filter(t => 
        t.subtasks.some(s => s.done) && !t.subtasks.every(s => s.done)
      ).length;
      const pending = total - completed - inProgress;

      setStats({ total, completed, inProgress, pending });

      // Get today's subtasks
      const today = [];
      allTasks.forEach(task => {
        task.subtasks?.forEach(subtask => {
          if (!subtask.done) {
            today.push({
              ...subtask,
              taskName: task.taskName,
              taskId: task.taskId,
            });
          }
        });
      });
      setTodaySubtasks(today.slice(0, 8));
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ title, value, icon, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${color} text-4xl opacity-20`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your task overview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Tasks" 
              value={stats.total} 
              icon="📋" 
              color="text-primary-600"
              bgColor="bg-white"
            />
            <StatCard 
              title="In Progress" 
              value={stats.inProgress} 
              icon="⚡" 
              color="text-warning-600"
              bgColor="bg-white"
            />
            <StatCard 
              title="Completed" 
              value={stats.completed} 
              icon="✅" 
              color="text-success-600"
              bgColor="bg-white"
            />
            <StatCard 
              title="Pending" 
              value={stats.pending} 
              icon="⏳" 
              color="text-gray-600"
              bgColor="bg-white"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Subtasks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Today's Focus</h2>
                  <span className="text-sm text-gray-500">{todaySubtasks.length} tasks</span>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  </div>
                ) : todaySubtasks.length > 0 ? (
                  <div className="space-y-3">
                    {todaySubtasks.map((subtask, index) => (
                      <div 
                        key={index} 
                        onClick={() => router.push(`/tasks/${subtask.taskId}`)}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                              {subtask.name}
                            </p>
                            <p className="text-sm text-gray-500">{subtask.taskName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            subtask.priority === 'High' ? 'bg-danger-100 text-danger-700' :
                            subtask.priority === 'Medium' ? 'bg-warning-100 text-warning-700' :
                            'bg-success-100 text-success-700'
                          }`}>
                            {subtask.priority}
                          </span>
                          <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full">
                            {subtask.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎉</div>
                    <p className="text-gray-600 mb-4">All caught up! No pending tasks.</p>
                    <button 
                      onClick={() => router.push('/tasks')}
                      className="btn-primary"
                    >
                      Create New Task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Recent Tasks */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-soft p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/tasks')}
                    className="w-full bg-white text-primary-600 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>➕</span>
                    <span>Create New Task</span>
                  </button>
                  <button 
                    onClick={() => router.push('/profile')}
                    className="w-full bg-primary-500 hover:bg-primary-400 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </button>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Tasks</h3>
                {tasks.slice(0, 5).map(task => {
                  const completed = task.subtasks.filter(s => s.done).length;
                  const total = task.subtasks.length;
                  const progress = Math.round((completed / total) * 100);
                  
                  return (
                    <div 
                      key={task.taskId}
                      onClick={() => router.push(`/tasks/${task.taskId}`)}
                      className="mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <p className="font-medium text-gray-900 mb-2 truncate">{task.taskName}</p>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>{completed}/{total} subtasks</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && !loading && (
                  <p className="text-gray-500 text-sm text-center py-4">No tasks yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
