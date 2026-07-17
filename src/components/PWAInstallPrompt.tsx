"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, CheckCircle } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setInstalled(true);
    }
    const dismissedValue = localStorage.getItem("pwa-install-dismissed");
    if (dismissedValue) {
      setDismissed(true);
    }
  }, [isInstalled]);

  if (!isInstallable || isInstalled || dismissed || installed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setInstalled(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-96 z-50"
      >
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl card-glass">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-xl shrink-0">
              <Smartphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-white font-semibold text-sm">Install Agency OS</h3>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Add to home screen for instant access & push notifications
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  Works offline
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function PWAInstallSuccess() {
  const { isInstalled } = usePWA();

  if (!isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-96 z-50"
      >
        <div className="bg-green-950/50 border border-green-800/50 rounded-2xl p-4 shadow-2xl card-glass">
          <div className="flex items-center gap-3">
            <div className="bg-green-600/20 p-2 rounded-xl shrink-0">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">App Installed!</h3>
              <p className="text-neutral-400 text-xs mt-0.5">
                Agency OS is now on your home screen
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
