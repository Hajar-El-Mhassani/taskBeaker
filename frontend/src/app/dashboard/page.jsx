'use client';

import { useState, useEffect } from 'react';
import { get } from '@/lib/api';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [todaySubtasks, setTodaySubtasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const response = await get('/tasks');
      const allTasks = response.data.tasks || [];
      setTasks(allTasks);

      // Filter today's subtasks (simplified - just show all incomplete subtasks)
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
      setTodaySubtasks(today.slice(0, 10)); // Show first 10
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          {/* Today's Tasks */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Today's Subtasks</h2>
            {loading ? (
              <p>Loading...</p>
            ) : todaySubtasks.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <ul className="space-y-3">
                  {todaySubtasks.map((subtask, index) => (
                    <li key={index} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium text-gray-900">{subtask.name}</p>
                        <p className="text-sm text-gray-500">{subtask.taskName}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          subtask.priority === 'High' ? 'bg-red-100 text-red-800' :
                          subtask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {subtask.priority}
                        </span>
                        <span className="text-sm text-gray-600">{subtask.duration}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-600">No subtasks for today. Create a new task plan!</p>
            )}
          </div>

          {/* Active Task Plans */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Active Task Plans</h2>
            {loading ? (
              <p>Loading...</p>
            ) : tasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => (
                  <TaskCard key={task.taskId} task={task} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No task plans yet. Create your first one!</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
