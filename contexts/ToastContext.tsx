
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[300px] p-4 rounded shadow-lg flex items-center justify-between animate-fade-in-up transition-all ${
              t.type === 'success' ? 'bg-white border-l-4 border-green-500 text-gray-800' :
              t.type === 'error' ? 'bg-white border-l-4 border-red-500 text-gray-800' :
              'bg-white border-l-4 border-blue-500 text-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
              {t.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
              {t.type === 'info' && <Info size={20} className="text-blue-500" />}
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
