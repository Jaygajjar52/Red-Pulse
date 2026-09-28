import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-canvas)] dark:bg-[#121110]">
          <div className="max-w-md w-full rounded-2xl border border-stone-200 bg-white p-6 shadow-lg text-center dark:border-stone-800 dark:bg-stone-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-stone-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              An unexpected error occurred while displaying this page.
            </p>
            {this.state.error && (
              <div className="mt-4 text-left p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-mono text-rose-700 dark:text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={this.handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
