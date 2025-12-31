import React from 'react';

interface FunButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'neutral';
  fullWidth?: boolean;
}

export function FunButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  fullWidth = false,
  ...props 
}: FunButtonProps) {
  
  const baseStyles = "relative font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] outline-none select-none";
  
  const variants = {
    primary: "bg-blue-500 text-white border-b-4 border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:border-b-0 active:translate-y-1",
    success: "bg-green-500 text-white border-b-4 border-green-700 hover:bg-green-400 hover:border-green-600 active:border-b-0 active:translate-y-1",
    danger: "bg-red-500 text-white border-b-4 border-red-700 hover:bg-red-400 hover:border-red-600 active:border-b-0 active:translate-y-1",
    neutral: "bg-gray-200 text-gray-700 border-b-4 border-gray-400 hover:bg-gray-100 hover:border-gray-300 active:border-b-0 active:translate-y-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-900 dark:hover:bg-gray-600",
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
