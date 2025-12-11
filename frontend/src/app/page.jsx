'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-primary-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-brand-500 to-primary-600 bg-clip-text text-transparent">
                TaskBreaker
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-lg transition-all"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-brand-500 to-primary-600 text-white hover:from-brand-600 hover:to-primary-700 font-bold px-6 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Break Down Your Tasks
            <br />
            <span className="bg-gradient-to-r from-brand-500 to-primary-600 bg-clip-text text-transparent">
              With AI Power
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform complex projects into manageable subtasks with AI-powered planning. 
            Track progress, set schedules, and achieve your goals faster.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-brand-500 to-primary-600 text-white hover:from-brand-600 hover:to-primary-700 font-bold px-8 py-4 rounded-lg transition-all shadow-xl hover:shadow-2xl text-lg w-full sm:w-auto"
            >
              Start Free Today →
            </Link>
            <Link
              href="/login"
              className="bg-white text-gray-700 hover:bg-gray-50 font-bold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl border-2 border-gray-200 text-lg w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Planning</h3>
              <p className="text-gray-600">
                Let AI break down your tasks into actionable subtasks with smart scheduling and priority management.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your progress with visual indicators, completion percentages, and detailed breakdowns.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Scheduling</h3>
              <p className="text-gray-600">
                Organize tasks by days or hours with intelligent time allocation based on your preferences.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-20 text-center">
            <p className="text-gray-500 mb-4">Trusted by productive teams worldwide</p>
            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <div className="text-4xl">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="font-semibold text-gray-900 mb-2">TaskBreaker</p>
            <p className="text-sm">© 2024 TaskBreaker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
