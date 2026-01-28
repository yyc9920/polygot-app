import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const variantConfig: Record<ToastVariant, { icon: typeof Info; bgClass: string; iconClass: string }> = {
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-500',
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    iconClass: 'text-green-500',
  },
  warning: {
    icon: AlertCircle,
    bgClass: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-500',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    iconClass: 'text-red-500',
  },
};

function ToastNotification({ 
  toast, 
  onDismiss 
}: { 
  toast: ToastItem; 
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    const exitTimer = setTimeout(() => setIsExiting(true), toast.duration - 200);
    const dismissTimer = setTimeout(onDismiss, toast.duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
        max-w-[90vw] sm:max-w-[400px]
        transition-all duration-200 ease-out
        ${config.bgClass}
        ${isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      role="alert"
    >
      <Icon size={20} className={`flex-shrink-0 ${config.iconClass}`} />
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-100 line-clamp-2">
        {toast.message}
      </p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  const visibleToasts = toasts.slice(-3);

  if (visibleToasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-20 sm:bottom-6 left-1/2 sm:left-auto sm:right-6 -translate-x-1/2 sm:translate-x-0 z-50 flex flex-col-reverse gap-2 pointer-events-none"
      aria-live="polite"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification
            toast={toast}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
