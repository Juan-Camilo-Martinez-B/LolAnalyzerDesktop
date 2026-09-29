import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, Zap, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'hextech';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 4000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [toast, duration, onDismiss]);

  const typeStyles: Record<ToastType, { icon: React.ReactNode; borderColor: string; iconColor: string }> = {
    info: { icon: <Info size={18} />, borderColor: 'var(--hextech-cyan)', iconColor: 'var(--hextech-cyan)' },
    success: { icon: <CheckCircle size={18} />, borderColor: 'var(--accent-green)', iconColor: 'var(--accent-green)' },
    warning: { icon: <AlertTriangle size={18} />, borderColor: 'var(--hextech-gold)', iconColor: 'var(--hextech-gold)' },
    error: { icon: <XCircle size={18} />, borderColor: 'var(--accent-red)', iconColor: 'var(--accent-red)' },
    hextech: { icon: <Zap size={18} />, borderColor: 'var(--hextech-gold)', iconColor: 'var(--hextech-gold)' },
  };

  const style = typeStyles[toast.type];

  return (
    <div
      style={{
        position: 'relative',
        minWidth: '280px',
        maxWidth: '380px',
        background: 'var(--bg-glass-heavy)',
        border: `1px solid ${style.borderColor}`,
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        padding: '12px 14px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ color: style.iconColor, marginTop: '2px', flexShrink: 0 }}>{style.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{toast.title}</div>
        {toast.message && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{toast.message}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>

      {/* Timer Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          backgroundColor: style.borderColor,
          transition: 'width 0.04s linear',
        }}
      />
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};
