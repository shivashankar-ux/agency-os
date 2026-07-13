"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationOptionsExtended extends NotificationOptions {
  vibrate?: number[];
}

interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  icon?: string;
  sound?: string;
  vibrate?: number[];
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

let audioContext: AudioContext | null = null;
let sirenBuffer: AudioBuffer | null = null;

async function initSirenSound() {
  if (typeof window === "undefined") return;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const response = await fetch("/sounds/siren.wav");
    const arrayBuffer = await response.arrayBuffer();
    sirenBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.warn("Could not load siren sound:", error);
  }
}

function playSiren() {
  if (!audioContext || !sirenBuffer) return;
  
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  
  const source = audioContext.createBufferSource();
  source.buffer = sirenBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}

async function playSirenLoop(times = 3, interval = 3000) {
  for (let i = 0; i < times; i++) {
    playSiren();
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export function usePushNotifications(userId?: string) {
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    setIsSupported("Notification" in window && "serviceWorker" in navigator && "PushManager" in window);
    setPermission(Notification.permission);

    navigator.serviceWorker.ready.then((registration) => {
      swRef.current = registration;
      
      registration.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscription({
            endpoint: sub.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
              auth: arrayBufferToBase64(sub.getKey("auth")!),
            },
          });
          setIsSubscribed(true);
        }
      });
    });

    initSirenSound();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === "granted";
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !swRef.current) return false;
    
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      if (!VAPID_PUBLIC_KEY) {
        console.error("VAPID public key not configured");
        return false;
      }

      const sub = await swRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
          auth: arrayBufferToBase64(sub.getKey("auth")!),
        },
      };

      setSubscription(subscriptionData);
      setIsSubscribed(true);

      await sendSubscriptionToServer(subscriptionData, userId);
      return true;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      return false;
    }
  }, [isSupported, permission, requestPermission, userId]);

  const unsubscribe = useCallback(async () => {
    if (!swRef.current) return false;
    
    try {
      const sub = await swRef.current.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);
        await deleteSubscriptionFromServer(userId);
        return true;
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
    return false;
  }, [userId]);

interface NotificationOptionsExtended extends NotificationOptions {
  vibrate?: number[];
  actions?: NotificationAction[];
}

const showLocalNotification = useCallback(async (payload: NotificationPayload) => {
    if (!swRef.current) return;
    
    const options: NotificationOptionsExtended = {
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      vibrate: payload.vibrate || [200, 100, 200, 100, 200, 100, 400],
      tag: payload.tag || "agency-os-notification",
      requireInteraction: payload.requireInteraction ?? true,
      actions: payload.actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
      data: {
        url: payload.url || "/dashboard",
        ...payload.data,
      },
    };

    try {
      await swRef.current.showNotification(payload.title, options);
      playSirenLoop(3, 2000);
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }, []);

  const showSirenAlert = useCallback(async (title: string, body: string, url?: string) => {
    await showLocalNotification({
      title,
      body,
      tag: "siren-alert",
      url: url || "/dashboard",
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 1000],
    });
  }, [showLocalNotification]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
    showSirenAlert,
    playSiren,
    playSirenLoop,
  };
}

async function sendSubscriptionToServer(subscription: PushSubscriptionData, userId?: string) {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, userId }),
    });
  } catch (error) {
    console.error("Failed to send subscription to server:", error);
  }
}

async function deleteSubscriptionFromServer(userId?: string) {
  try {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch (error) {
    console.error("Failed to delete subscription from server:", error);
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export { playSiren, playSirenLoop };