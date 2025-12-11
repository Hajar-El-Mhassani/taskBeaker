'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { get, patch, del } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TaskDetailPage({ params }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('schedule'); // 'schedule' or 'list'
  const router = useRouter();

  useEffect(() => {
    loadTask();
  }, []);

  async function loadTask() {
    try {
      const response = await get(`/tasks/${params.taskId}`);
      console.log('Task data loaded:', response.data);
      console.log('First subtask:', response.data.subtasks[0]);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSubtask(subtaskId, currentStatus) {
    try {
      // Optimistically update UI
      setTask(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(s => 
          s.id === subtaskId ? { ...s, done: !currentStatus } : s
        )
      }));
      
      const response = await patch(`/tasks/${params.taskId}/subtasks/${subtaskId}`, {
        done: !currentStatus,
      });
      setTask(response.data);
    } catch (error) {
      console.error('Failed to update subtask:', error);
      // Revert on error
      loadTask();
    }
  }

  async function updateSubtaskProgress(subtaskId, newProgress) {
    try {
      const response = await patch(`/tasks/${params.taskId}/subtasks/${subtaskId}`, {
        progress: newProgress,
      });
      
      // Only update if successful
      if (response.data) {
        setTask(response.data);
      }
    } catch (error) {
      console.error('Failed to update subtask progress:', error);
      // Don't revert - keep the local state
      alert('Failed to save progress. Please try again.');
    }
  }

  async function deleteTask() {
    if (!confirm('Are you sure you want to delete this task plan? This action cannot be undone.')) return;

    try {
      await del(`/tasks/${params.taskId}`);
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading task details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Task not found</h2>
            <p className="text-gray-600 mb-6">This task may have been deleted or doesn't exist.</p>
            <button onClick={() => router.push('/tasks')} className="btn-primary">
              ← Back to Tasks
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const completedCount = task.subtasks.filter(s => s.done).length;
  const progress = Math.round((completedCount / task.subtasks.length) * 100);
  const isCompleted = completedCount === task.subtasks.length;

  // Group subtasks by schedule
  const scheduleGroups = {};
  if (task.schedule) {
    Object.keys(task.schedule).forEach(key => {
      const subtaskIds = task.schedule[key];
      scheduleGroups[key] = subtaskIds.map(id => 
        task.subtasks.find(s => s.id === id)
      ).filter(Boolean);
    });
  }

  const SubtaskItem = ({ subtask, showCheckbox = true }) => {
    const [expanded, setExpanded] = useState(true); // Default to expanded to show details
    const [localProgress, setLocalProgress] = useState(subtask.progress || 0);
    const [isSaving, setIsSaving] = useState(false);
    const currentProgress = subtask.progress || 0;
    
    // Only sync when subtask ID changes (new subtask loaded)
    const prevSubtaskId = useRef(subtask.id);
    useEffect(() => {
      if (prevSubtaskId.current !== subtask.id) {
        setLocalProgress(subtask.progress || 0);
        prevSubtaskId.current = subtask.id;
      }
    }, [subtask.id, subtask.progress]);
    
    // Determine status based on actual progress from database
    const getStatus = () => {
      if (subtask.done) return { label: 'Completed', color: 'bg-success-100 text-success-700', icon: '✅' };
      if (localProgress > 0) return { label: 'In Progress', color: 'bg-warning-100 text-warning-700', icon: '⚡' };
      return { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: '⏳' };
    };
    
    const status = getStatus();
    const hasDetails = subtask.details && subtask.details.length > 0;

    return (
      <div className={`rounded-lg transition-all ${
        subtask.done ? 'bg-gray-50 border-2 border-success-200' : 'bg-white border-2 border-gray-100 hover:border-brand-200 hover:shadow-sm'
      }`}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={subtask.done}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSubtask(subtask.id, subtask.done);
                  }}
                  className="w-6 h-6 text-brand-600 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-brand-500 cursor-pointer mt-0.5 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                  <p className={`font-semibold text-base ${subtask.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {subtask.name}
                  </p>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${status.color} flex items-center space-x-1 whitespace-nowrap`}>
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                  </span>
                </div>
                
                {/* Always show details if available */}
                {hasDetails && (
                  <div className="mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                      }}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 mb-2 flex items-center space-x-1"
                    >
                      <span className="text-xs">{expanded ? '▼' : '▶'}</span>
                      <span>{expanded ? 'Hide' : 'Show'} Details ({subtask.details.length})</span>
                    </button>
                    
                    {expanded && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <ul className="space-y-2">
                          {subtask.details.map((detail, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                              <span className="text-brand-500 font-bold mt-0.5">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Slider - always visible when not done */}
                {!subtask.done && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-gray-700">Track Progress:</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-brand-600">{localProgress}%</span>
                        {isSaving && (
                          <span className="text-xs text-green-600 font-semibold">✓ Saved</span>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={localProgress}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newValue = parseInt(e.target.value);
                        setLocalProgress(newValue);
                      }}
                      onMouseUp={async (e) => {
                        e.stopPropagation();
                        setIsSaving(true);
                        await updateSubtaskProgress(subtask.id, localProgress);
                        setTimeout(() => setIsSaving(false), 1500);
                      }}
                      onTouchEnd={async (e) => {
                        e.stopPropagation();
                        setIsSaving(true);
                        await updateSubtaskProgress(subtask.id, localProgress);
                        setTimeout(() => setIsSaving(false), 1500);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                      style={{
                        background: `linear-gradient(to right, #f97316 0%, #3b82f6 ${localProgress}%, #e5e7eb ${localProgress}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1 font-medium">
                      <span>Not Started</span>
                      <span>In Progress</span>
                      <span>Almost Done</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2 ml-3">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                subtask.priority === 'High' ? 'bg-danger-100 text-danger-700' :
                subtask.priority === 'Medium' ? 'bg-warning-100 text-warning-700' :
                'bg-success-100 text-success-700'
              }`}>
                {subtask.priority}
              </span>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                ⏱️ {subtask.duration}
              </span>
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
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => router.back()} 
              className="text-primary-600 hover:text-primary-700 font-medium mb-4 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Tasks</span>
            </button>
            
            <div className="bg-white rounded-xl shadow-soft p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">{task.taskName}</h1>
                    {isCompleted && <span className="text-4xl">🎉</span>}
                  </div>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>{task.timeMode === 'days' ? `${task.amount} days` : `${task.amount} hours`}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>⏱️</span>
                      <span>{task.totalEstimatedTime}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>📋</span>
                      <span>{task.subtasks.length} subtasks</span>
                    </span>
                  </div>
                </div>
                <button 
                  onClick={deleteTask} 
                  className="bg-danger-50 text-danger-600 hover:bg-danger-100 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Overall Progress</span>
                  <span className="font-bold">{completedCount}/{task.subtasks.length} completed ({progress}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-success-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setView('schedule')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    view === 'schedule' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📅 Schedule View
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    view === 'list' 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 List View
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {view === 'schedule' && Object.keys(scheduleGroups).length > 0 ? (
                // Schedule View
                Object.keys(scheduleGroups).sort().map(dayKey => {
                  const dayNumber = dayKey.replace(/\D/g, '');
                  const label = task.timeMode === 'days' ? `Day ${dayNumber}` : `Hour ${dayNumber}`;
                  const subtasks = scheduleGroups[dayKey];
                  const dayCompleted = subtasks.filter(s => s.done).length;
                  const dayProgress = Math.round((dayCompleted / subtasks.length) * 100);

                  return (
                    <div key={dayKey} className="bg-white rounded-xl shadow-soft p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{label}</h3>
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          {dayCompleted}/{subtasks.length} done
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${dayProgress}%` }}
                        />
                      </div>
                      <div className="space-y-3">
                        {subtasks.map(subtask => (
                          <SubtaskItem key={subtask.id} subtask={subtask} />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // List View
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">All Subtasks</h3>
                  <div className="space-y-3">
                    {task.subtasks.map(subtask => (
                      <SubtaskItem key={subtask.id} subtask={subtask} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notes */}
              {task.notes && (
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">📝 Notes</h3>
                  <p className="text-gray-700 leading-relaxed">{task.notes}</p>
                </div>
              )}

              {/* Stats */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-soft p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Task Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-primary-100">Total Subtasks</span>
                    <span className="text-2xl font-bold">{task.subtasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-100">Completed</span>
                    <span className="text-2xl font-bold text-success-300">{completedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-100">Remaining</span>
                    <span className="text-2xl font-bold text-warning-300">{task.subtasks.length - completedCount}</span>
                  </div>
                  <div className="border-t border-primary-500 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-100">Progress</span>
                      <span className="text-3xl font-bold">{progress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Priority Breakdown</h3>
                <div className="space-y-3">
                  {['High', 'Medium', 'Low'].map(priority => {
                    const count = task.subtasks.filter(s => s.priority === priority).length;
                    if (count === 0) return null;
                    return (
                      <div key={priority} className="flex items-center justify-between">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          priority === 'High' ? 'bg-danger-100 text-danger-700' :
                          priority === 'Medium' ? 'bg-warning-100 text-warning-700' :
                          'bg-success-100 text-success-700'
                        }`}>
                          {priority}
                        </span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
