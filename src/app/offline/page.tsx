"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 card-glass">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-600/20 rounded-2xl flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-amber-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
          <p className="text-neutral-400 text-sm mb-6">
            No internet connection detected. Some features may be limited.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-touch bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              Try Again
            </button>

            <Link
              href="/dashboard"
              className="w-full btn-touch bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard (Cached)
            </Link>
          </div>

          <p className="text-xs text-neutral-500 mt-4">
            Cached data will be available. Changes will sync when you're back online.
          </p>
        </div>

        <p className="text-xs text-neutral-600">
          Agency OS works offline with cached data
        </p>
      </div>
    </div>
  );
}
