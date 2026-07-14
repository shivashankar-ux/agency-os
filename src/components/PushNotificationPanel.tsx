"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Wifi, WifiOff, Volume2, VolumeX, CheckCircle, AlertCircle } from "lucide-react";
import { usePushNotifications, playSiren } from "@/hooks/usePushNotifications";
import { usePWA } from "@/hooks/usePWA";

export function PushNotificationPanel() {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    showSirenAlert,
    playSiren: playSirenHook,
    playSirenLoop
  } = usePushNotifications();
  const { isOnline, isInstalled } = usePWA();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleSubscribe = async () => {
    setTesting(true);
    const success = await subscribe();
    setTestResult(success ? "success" : "error");
    setTimeout(() => setTestResult(null), 3000);
    setTesting(false);
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
  };

  const handleTestSiren = () => {
    playSirenHook();
    playSirenLoop(2, 1500);
  };

  const handleTestNotification = async () => {
    await showSirenAlert(
      "Test Siren Alert",
      "This is a test notification with siren sound!",
      "/dashboard"
    );
  };

  if (!isSupported) {
    // Detect iOS/iPadOS
    const isIOS = typeof window !== "undefined" && 
      (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4"
      >
        <div className="flex items-start gap-3 text-neutral-500">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-neutral-300">
              {isIOS ? "App Installation Required" : "Push Notifications Unavailable"}
            </p>
            <p className="text-xs mt-1 text-neutral-400 leading-relaxed">
              {isIOS 
                ? "Apple requires you to install this app to receive push notifications. Tap the Share button in Safari and select 'Add to Home Screen', then open the app from your home screen."
                : "Your browser doesn't support push notifications. Try using Chrome or Edge."}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
        <div className={`p-2 rounded-xl shrink-0 ${
          isOnline ? "bg-green-600/20" : "bg-red-600/20"
        }`}>
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">Push Notifications</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isOnline ? "Online - Ready to receive alerts" : "Offline - Will sync when online"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isSubscribed 
              ? "bg-green-600/20 text-green-400" 
              : "bg-amber-600/20 text-amber-400"
          }`}>
            {isSubscribed ? "Subscribed" : "Not Subscribed"}
          </span>
        </div>
      </div>

      {!isSubscribed && permission !== "granted" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-indigo-600/10 border border-indigo-600/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl">
              <Bell className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Enable Siren Alerts</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Get loud siren notifications when tasks are assigned or deadlines approach
              </p>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={testing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {testing ? "Enabling..." : "Enable"}
            </button>
          </div>
        </motion.div>
      )}

      {isSubscribed && (
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-600/10 border border-green-600/20 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">Siren Alerts Active</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  You'll receive loud notifications for new tasks and pending items
                </p>
              </div>
              <button
                onClick={handleUnsubscribe}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded-lg transition-colors"
              >
                Disable
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTestSiren}
              disabled={testing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Siren</span>
            </button>
            <button
              onClick={handleTestNotification}
              disabled={testing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-xl text-indigo-400 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>Test Alert</span>
            </button>
          </div>

          {testResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                testResult === "success"
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              }`}
            >
              {testResult === "success" ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Subscription successful!
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  Failed to subscribe
                </>
              )}
            </motion.div>
          )}

          <div className="bg-neutral-800/50 rounded-xl p-3 text-xs text-neutral-500 space-y-1">
            <p className="font-medium text-neutral-400">How Siren Alerts Work:</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Loud siren sound plays 3 times</li>
              <li>Phone vibrates with pattern</li>
              <li>Notification stays on screen until dismissed</li>
              <li>Works even when app is in background</li>
              <li>Install as PWA for best experience</li>
            </ul>
          </div>
        </div>
      )}

      {!isInstalled && isSupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-600/10 border border-amber-600/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/20 rounded-xl">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Install for Better Notifications</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Add to home screen for reliable background push notifications
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}