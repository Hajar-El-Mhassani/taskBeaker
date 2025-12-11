'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { get } from '@/lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tasksDropdownOpen, setTasksDropdownOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user && tasksDropdownOpen) {
      loadTasks();
    }
  }, [user, tasksDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTasksDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadTasks() {
    try {
      const response = await get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-brand-500 to-primary-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={user ? '/dashboard' : '/'} className="text-2xl font-bold text-white flex items-center space-x-2">
              <span>📋</span>
              <span>TaskBreaker</span>
            </Link>
            {user && (
              <div className="hidden md:flex ml-10 space-x-2">
                <Link 
                  href="/dashboard" 
                  className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition-all font-medium"
                >
                  Dashboard
                </Link>
                
                {/* Tasks Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setTasksDropdownOpen(!tasksDropdownOpen)}
                    className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition-all font-medium flex items-center space-x-1"
                  >
                    <span>Your Tasks</span>
                    <span className={`transform transition-transform ${tasksDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {tasksDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">Your Tasks</h3>
                          <span className="text-xs text-gray-500">{tasks.length} total</span>
                        </div>
                      </div>
                      {tasks.length > 0 ? (
                        <div className="py-2">
                          {tasks.slice(0, 10).map(task => {
                            const completed = task.subtasks.filter(s => s.done).length;
                            const total = task.subtasks.length;
                            const progress = Math.round((completed / total) * 100);
                            
                            return (
                              <Link
                                key={task.taskId}
                                href={`/tasks/${task.taskId}`}
                                onClick={() => setTasksDropdownOpen(false)}
                                className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <p className="font-medium text-gray-900 truncate mb-1">{task.taskName}</p>
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>{completed}/{total} subtasks</span>
                                  <span className="font-semibold text-brand-600">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-brand-500 to-primary-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <p className="mb-2">No tasks yet</p>
                          <Link 
                            href="/tasks"
                            onClick={() => setTasksDropdownOpen(false)}
                            className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                          >
                            Create your first task →
                          </Link>
                        </div>
                      )}
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <Link
                          href="/tasks"
                          onClick={() => setTasksDropdownOpen(false)}
                          className="block text-center text-brand-600 hover:text-brand-700 font-medium text-sm"
                        >
                          View All Tasks →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link 
                  href="/profile" 
                  className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg transition-all font-medium"
                >
                  Profile
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1.5 rounded-lg">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white text-brand-600 flex items-center justify-center font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-white font-medium">{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="bg-white text-brand-600 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium px-4 py-2 rounded-lg transition-all">
                  Login
                </Link>
                <Link href="/signup" className="bg-white text-brand-600 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-all">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
