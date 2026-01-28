import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ToastContainer, type ToastItem, type ToastVariant } from '../components/Toast';

interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (options: ToastOptions | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((options: ToastOptions | string) => {
    const opts: ToastOptions = typeof options === 'string' 
      ? { message: options } 
      : options;
    
    const newToast: ToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      message: opts.message,
      variant: opts.variant ?? 'info',
      duration: opts.duration ?? DEFAULT_DURATION,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions | string) => {
    addToast(options);
  }, [addToast]);

  const success = useCallback((message: string) => {
    addToast({ message, variant: 'success' });
  }, [addToast]);

  const error = useCallback((message: string) => {
    addToast({ message, variant: 'error' });
  }, [addToast]);

  const warning = useCallback((message: string) => {
    addToast({ message, variant: 'warning' });
  }, [addToast]);

  const info = useCallback((message: string) => {
    addToast({ message, variant: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
