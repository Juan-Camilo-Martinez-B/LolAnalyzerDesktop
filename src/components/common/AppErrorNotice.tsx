import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { dismissAppError, messageFromUnknown, subscribeAppError } from '../../services/userErrors';
import './appError.css';

export function AppErrorNotice() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeAppError(setMessage);
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error('[AppErrorNotice]', event.reason);
      setMessage(messageFromUnknown(event.reason));
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      unsub();
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="app-error-notice" role="alert">
      <p>{message}</p>
      <button
        type="button"
        aria-label="Cerrar aviso"
        onClick={() => {
          dismissAppError(message);
          setMessage('');
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
