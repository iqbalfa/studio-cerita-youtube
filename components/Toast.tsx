import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const icons: Record<string, React.ReactNode> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l8 14H2L10 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M10 8v4M10 14v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 9v5M10 6v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

const colors: Record<string, { bg: string; border: string; text: string }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
};

export const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const duration = toast.duration || 4000;
  const color = colors[toast.type] || colors.info;

  useEffect(() => {
    const exitTimer = setTimeout(() => setIsExiting(true), duration - 300);
    const dismissTimer = setTimeout(() => onDismiss(toast.id), duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${color.bg} ${color.border} ${color.text} transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
      role="alert"
      style={{ minWidth: 280, maxWidth: 420 }}
    >
      <span className="flex-shrink-0">{icons[toast.type]}</span>
      <span className="flex-1 text-sm font-medium leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
