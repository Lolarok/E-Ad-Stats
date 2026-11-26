import React from 'react';

interface State {
  hasError: boolean;
  message: string;
  isPermissionError: boolean;
}

export class FirestoreErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isPermissionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    let message = error?.message || 'Si è verificato un errore imprevisto.';
    let isPermissionError = false;
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.error === 'string') {
        isPermissionError =
          parsed.error.toLowerCase().includes('permission') ||
          parsed.error.toLowerCase().includes('insufficient');
        message = isPermissionError
          ? `Permessi Firebase insufficienti per l'operazione "${parsed.operationType}" su "${parsed.path || 'Firestore'}".`
          : parsed.error;
      }
    } catch {
      // Plain error message
    }
    return {
      hasError: true,
      message,
      isPermissionError,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h1 className="text-lg font-bold text-white">
              {this.state.isPermissionError
                ? 'Errore Permessi Cloud (Firebase)'
                : 'Errore di caricamento applicazione'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">{this.state.message}</p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Ricarica Applicazione
              </button>
              <button
                onClick={() => this.setState({ hasError: false, message: '', isPermissionError: false })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
              >
                Continua senza Cloud
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
