"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Terjadi Kesalahan
              </h1>
              <p className="text-slate-600 mb-4">
                Aplikasi mengalami error. Silakan refresh halaman atau coba lagi
                nanti.
              </p>
              {this.state.error && (
                <details className="text-left bg-slate-100 p-3 rounded text-sm mb-4">
                  <summary className="cursor-pointer font-medium text-slate-700 mb-2">
                    Detail Error
                  </summary>
                  <pre className="text-xs text-red-600 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
