import React, { Component, ReactNode } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('📍 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error Details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    console.log('🔄 Resetting error boundary...');
    this.setState({ hasError: false, error: null });
    // Force page reload
    window.location.href = window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#060910]">
          <div className="max-w-md w-full mx-auto px-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h1 className="text-lg font-semibold text-red-400">Algo deu errado</h1>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Houve um erro ao processar sua solicitação. Tente novamente.
              </p>
              <div className="bg-red-500/5 rounded-lg p-3 mb-4 max-h-24 overflow-auto">
                <p className="text-xs text-red-400 font-mono">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
