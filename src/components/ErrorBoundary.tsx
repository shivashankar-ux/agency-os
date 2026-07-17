"use client";

import { Component, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Home, WifiOff } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-3 w-fit mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-neutral-400 text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="btn-touch w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white-literal font-medium rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/dashboard"
                className="btn-touch w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </a>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left text-xs text-neutral-500">
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className="bg-neutral-950 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Offline boundary
export class OfflineBoundary extends Component<{ children: ReactNode }, { isOnline: boolean }> {
  state = { isOnline: typeof navigator !== "undefined" ? navigator.onLine : true };

  componentDidMount(): void {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  componentWillUnmount(): void {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  handleOnline = (): void => {
    this.setState({ isOnline: true });
  };

  handleOffline = (): void => {
    this.setState({ isOnline: false });
  };

  render(): ReactNode {
    return (
      <>
        {!this.state.isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 bg-amber-950 border-b border-amber-900 px-4 py-3 flex items-center justify-center gap-2"
          >
            <WifiOff className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">You're offline. Changes will sync when reconnected.</span>
          </motion.div>
        )}
        <div style={{ paddingTop: this.state.isOnline ? 0 : "48px" }}>
          {this.props.children}
        </div>
      </>
    );
  }
}

// Async error boundary for server components
export function AsyncErrorBoundary({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  // This is a client component wrapper for async errors
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
