import { Component, type ErrorInfo, type ReactNode } from 'react';
import './appError.css';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-error-screen" role="alert">
        <h1>Ocurrió un error</h1>
        <p>La pantalla no pudo mostrarse. Recarga la app e inténtalo de nuevo.</p>
        <button type="button" onClick={() => window.location.reload()}>Recargar</button>
      </div>
    );
  }
}
