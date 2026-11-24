import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ShieldCheck,
  PlusCircle,
  Send,
  Check
} from 'lucide-react';

const ToastContext = createContext(null);

const STORAGE_KEY = 'esg_notifications_history_v1';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'seed-notif-1',
    category: 'verified',
    title: 'Disclosures Verified',
    message: 'Scope 1 & Scope 2 disclosures passed validator integrity checks.',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    read: false
  },
  {
    id: 'seed-notif-2',
    category: 'submitted',
    title: 'Submission Disclosed',
    message: 'FY26-Q3 Corporate Energy & Emissions batch submitted for audit validation.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false
  },
  {
    id: 'seed-notif-3',
    category: 'created',
    title: 'Corporate Targets Configured',
    message: 'Multi-year decarbonization & diversity targets established.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true
  },
  {
    id: 'seed-notif-4',
    category: 'success',
    title: 'Official Report Compiled',
    message: 'FY 2026–27 Comprehensive ESG Report successfully generated.',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    read: true
  }
];

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolveRef = useRef(null);

  // Persistent notification history for the Notification Bell
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read notifications from storage', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not save notifications to storage', e);
    }
  }, [notifications]);

  // Record an event to history and show toast
  const notify = useCallback((category, message, customTitle) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);

    let defaultTitle = 'Notification';
    if (category === 'success') defaultTitle = 'Success';
    if (category === 'verified') defaultTitle = 'Verified';
    if (category === 'created') defaultTitle = 'Created';
    if (category === 'submitted') defaultTitle = 'Submitted';
    if (category === 'error') defaultTitle = 'Error';
    if (category === 'warning') defaultTitle = 'Warning';

    const title = customTitle || defaultTitle;

    // Add to floating toasts
    setToasts((prev) => [...prev, { id, category, message, title }]);

    // Auto dismiss toast after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);

    // Add to permanent notification center log
    const newNotification = {
      id,
      category,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const toast = {
    success: (msg, title) => notify('success', msg, title || 'Operation Successful'),
    verified: (msg, title) => notify('verified', msg, title || 'Verified & Approved'),
    created: (msg, title) => notify('created', msg, title || 'Created Successfully'),
    submitted: (msg, title) => notify('submitted', msg, title || 'Submitted for Review'),
    error: (msg, title) => notify('error', msg, title || 'Action Error'),
    warning: (msg, title) => notify('warning', msg, title || 'Warning Notice'),
    info: (msg, title) => notify('info', msg, title || 'Information')
  };

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Notifications management functions
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalCount = notifications.length;

  // Custom Promise-based Confirm Dialog (Drop-in replacement for window.confirm)
  const confirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
  }) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        type
      });
    });
  }, []);

  const handleConfirmClose = (result) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
    setConfirmDialog(null);
  };

  return (
    <ToastContext.Provider
      value={{
        toast,
        confirm,
        notifications,
        unreadCount,
        totalCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
        {toasts.map((t) => {
          const isSuccess = t.category === 'success';
          const isVerified = t.category === 'verified';
          const isCreated = t.category === 'created';
          const isSubmitted = t.category === 'submitted';
          const isError = t.category === 'error';
          const isWarning = t.category === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
                isVerified
                  ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-700 dark:text-emerald-100'
                  : isSuccess
                  ? 'bg-teal-50/95 border-teal-300 text-teal-950 dark:bg-teal-950/90 dark:border-teal-700 dark:text-teal-100'
                  : isCreated
                  ? 'bg-blue-50/95 border-blue-300 text-blue-950 dark:bg-blue-950/90 dark:border-blue-700 dark:text-blue-100'
                  : isSubmitted
                  ? 'bg-indigo-50/95 border-indigo-300 text-indigo-950 dark:bg-indigo-950/90 dark:border-indigo-700 dark:text-indigo-100'
                  : isError
                  ? 'bg-rose-50/95 border-rose-300 text-rose-950 dark:bg-rose-950/90 dark:border-rose-700 dark:text-rose-100'
                  : isWarning
                  ? 'bg-amber-50/95 border-amber-300 text-amber-950 dark:bg-amber-950/90 dark:border-amber-700 dark:text-amber-100'
                  : 'bg-slate-50/95 border-slate-300 text-slate-950 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isVerified && <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                {isCreated && <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                {isSubmitted && <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                {isError && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                {!isSuccess && !isVerified && !isCreated && !isSubmitted && !isError && !isWarning && (
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <div className="flex-1 text-xs">
                {t.title && <div className="font-bold mb-0.5">{t.title}</div>}
                <div className="leading-relaxed opacity-90">{t.message}</div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                }`}
              >
                {confirmDialog.type === 'danger' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed whitespace-pre-line">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)] mt-1">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--surface-container)] transition-colors"
              >
                {confirmDialog.cancelText}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-all ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[var(--primary)] hover:opacity-95'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
