'use client';

import Link from 'next/link';

export default function TaskCard({ task }) {
  const completedCount = task.subtasks?.filter(s => s.done).length || 0;
  const totalCount = task.subtasks?.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Link href={`/tasks/${task.taskId}`}>
      <div className="card cursor-pointer">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.taskName}</h3>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>{task.timeMode === 'days' ? `${task.amount} days` : `${task.amount} hours`}</span>
          <span>{task.totalEstimatedTime}</span>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completedCount}/{totalCount} subtasks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Created {new Date(task.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
