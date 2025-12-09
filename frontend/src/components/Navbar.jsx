'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={user ? '/dashboard' : '/'} className="text-2xl font-bold text-primary-600">
              TaskBreaker
            </Link>
            {user && (
              <div className="hidden md:flex ml-10 space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md">
                  Dashboard
                </Link>
                <Link href="/tasks" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md">
                  Tasks
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md">
                  Profile
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  {user.avatarUrl && (
                    <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                  )}
                  <span className="text-gray-700">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">
                  Login
                </Link>
                <Link href="/signup" className="btn-primary">
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
