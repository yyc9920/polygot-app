import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[50vh] text-blue-500 animate-pulse">
      <Loader2 size={48} className="animate-spin mb-4" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  );
}
