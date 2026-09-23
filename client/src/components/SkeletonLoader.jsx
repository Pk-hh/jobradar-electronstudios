import React from 'react';

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3 border-l-4 border-l-gray-300 animate-shimmer">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-3/4" />
          <div className="h-3 bg-gray-200 rounded-md w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 rounded-md w-20" />
        <div className="h-6 bg-gray-200 rounded-md w-24" />
        <div className="h-6 bg-gray-200 rounded-md w-16" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="h-4 bg-gray-200 rounded-md w-28" />
        <div className="h-4 bg-gray-200 rounded-md w-20" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-shimmer bg-white min-h-screen">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded-md w-3/4" />
          <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-16 bg-gray-200 rounded-xl" />
      </div>
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-gray-200 rounded-md w-1/3" />
        <div className="h-20 bg-gray-200 rounded-xl w-full" />
      </div>
    </div>
  );
}
