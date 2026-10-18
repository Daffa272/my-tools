import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl p-3.5 shadow-lg border text-xs font-medium backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-800'
              : toast.type === 'info'
              ? 'bg-stone-900/90 text-stone-100 border-stone-700'
              : 'bg-emerald-950/90 text-emerald-100 border-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="h-4 w-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-white/60 hover:text-white p-0.5 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
