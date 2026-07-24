import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in React Component Tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
          <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="mx-auto w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">
                Se detectó un inconveniente
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ocurrió una interrupción temporal al actualizar la pantalla o procesar el registro. Tus datos guardados están seguros en el almacenamiento del sistema.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950/60 p-3 rounded-lg text-left text-[11px] font-mono text-red-300 border border-red-900/40 max-h-28 overflow-y-auto break-words">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-[#007AFF] hover:bg-[#0062cc] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar y Restablecer Pantalla
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
