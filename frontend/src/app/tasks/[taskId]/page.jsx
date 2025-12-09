'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { get, patch, del } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TaskDetailPage({ params }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTask();
  }, []);

  async function loadTask() {
    try {
      const response = await get(`/tasks/${params.taskId}`);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSubtask(subtaskId, currentStatus) {
    try {
      const response = await patch(`/tasks/${params.taskId}/subtasks/${subtaskId}`, {
        done: !currentStatus,
      });
      setTask(response.data);
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  }

  async function deleteTask() {
    if (!confirm('Are you sure you want to delete this task plan?')) return;

    try {
      await del(`/tasks/${params.taskId}`);
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>Task not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  const completedCount = task.subtasks.filter(s => s.done).length;
  const progress = Math.round((completedCount / task.subtasks.length) * 100);

  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button onClick={() => router.back()} className="text-primary-600 hover:text-primary-700 mb-4">
              ← Back to Tasks
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.taskName}</h1>
                <p className="text-gray-600">
                  {task.timeMode === 'days' ? `${task.amount} days` : `${task.amount} hours`} • {task.totalEstimatedTime}
                </p>
              </div>
              <button onClick={deleteTask} className="btn-danger">
                Delete
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedCount}/{task.subtasks.length} subtasks ({progress}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Subtasks</h2>
            <ul className="space-y-3">
              {task.subtasks.map(subtask => (
                <li key={subtask.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={subtask.done}
                      onChange={() => toggleSubtask(subtask.id, subtask.done)}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${subtask.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {subtask.name}
                      </p>
                    </div>
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

          {/* Notes */}
          {task.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Notes</h2>
              <p className="text-gray-700">{task.notes}</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
