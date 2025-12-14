import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

interface ToastProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  text1: string;
  text2?: string;
}

interface ToastContextType {
  showToast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const showToast = (props: ToastProps) => {
  const event = new CustomEvent('show-toast', { detail: props });
  window.dispatchEvent(event);
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);
  const [nextId, setNextId] = useState(0);

  const showToastCallback = useCallback((props: ToastProps) => {
    const id = nextId;
    setNextId(id + 1);
    setToasts(prev => [...prev, { ...props, id }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, [nextId]);

  React.useEffect(() => {
    const handler = (e: any) => {
      showToastCallback(e.detail);
    };
    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, [showToastCallback]);

  return (
    <ToastContext.Provider value={{ showToast: showToastCallback }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
            <div className="toast-content">
              <div className="toast-title">{toast.text1}</div>
              {toast.text2 && <div className="toast-message">{toast.text2}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
