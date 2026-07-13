"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushNotificationSubscription() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  };

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) {
      setError("VAPID public key not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        setError("Notification permission denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("User not authenticated");
        return;
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to subscribe");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      const response = await fetch("/api/push/unsubscribe", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to remove subscription");
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error("Unsubscribe error:", err);
      setError(err.message || "Failed to unsubscribe");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscription = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  if (permission === "denied") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-900/30 p-2 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Notifications Blocked</p>
            <p className="text-neutral-500 text-xs mt-0.5">
              Enable notifications in browser settings to receive task alerts with siren sound
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
      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${
          isSubscribed ? "bg-green-900/30" : "bg-indigo-900/30"
        }`}>
          {isSubscribed ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Bell className="w-5 h-5 text-indigo-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">
            {isSubscribed ? "Push Notifications Enabled" : "Enable Push Notifications"}
          </p>
          <p className="text-neutral-500 text-xs mt-0.5">
            {isSubscribed
              ? "You'll receive siren alerts for new tasks and pending items"
              : "Get siren notifications when tasks are assigned or pending"}
          </p>
        </div>
        <button
          onClick={toggleSubscription}
          disabled={isLoading}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            isSubscribed
              ? "bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <BellOff className="w-3.5 h-3.5" />
              Disable
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5" />
              Enable
            </>
          )}
        </button>
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 text-red-400 text-xs flex items-center gap-1.5"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}