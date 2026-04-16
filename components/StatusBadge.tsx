'use client';

interface StatusBadgeProps {
  isActive: boolean;
}

export default function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
      isActive 
        ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
        : 'bg-gray-700/50 text-gray-400 border border-gray-600'
    }`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
      {isActive ? 'COLLECTING' : 'WAITING'}
    </div>
  );
}
