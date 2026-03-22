import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark p-6">
          <div className="bg-white dark:bg-black p-8 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-sm w-full border border-red-100 dark:border-red-900/30">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, your progress is safe.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full bg-primary py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg tap-bounce"
            >
              <RefreshCw size={20} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    const { children } = this.props;
    return children;
  }
}
