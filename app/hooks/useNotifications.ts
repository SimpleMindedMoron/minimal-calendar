"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

function serializeSub(sub: PushSubscription) {
  // Standard PushSubscription JSON: { endpoint, keys: { p256dh, auth } }
  return JSON.parse(JSON.stringify(sub)) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
}

const NOTIF_ENABLED_KEY = "align_notif_enabled";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);

  // On mount — detect support and restore persisted subscription state
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setIsSupported(true);
    const perm = Notification.permission;
    setPermission(perm);

    if (perm === "granted" && localStorage.getItem(NOTIF_ENABLED_KEY) === "true") {
      // Verify the SW still has an active push subscription
      void navigator.serviceWorker.ready.then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setIsSubscribed(true);
        } else {
          // Permission still granted but subscription gone (e.g. browser cleared it)
          localStorage.removeItem(NOTIF_ENABLED_KEY);
        }
      });
    } else if (perm !== "granted") {
      localStorage.removeItem(NOTIF_ENABLED_KEY);
    }
  }, []);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setIsLoading(false); return false; }

      // 2. Get SW registration
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe via PushManager
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key not configured. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to Vercel env vars.");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });

      // 4. Save subscription to Supabase via our API
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", subscription: serializeSub(sub) }),
      });

      if (!res.ok) {
        await sub.unsubscribe(); // Rollback if server save failed
        throw new Error("Failed to save subscription to server");
      }

      localStorage.setItem(NOTIF_ENABLED_KEY, "true");
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("[Align] Notification subscribe failed:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  // ── Unsubscribe ────────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Notify server to remove from Supabase
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsubscribe", subscription: serializeSub(sub) }),
        });
        await sub.unsubscribe();
      }

      localStorage.removeItem(NOTIF_ENABLED_KEY);
      setIsSubscribed(false);
    } catch (err) {
      console.error("[Align] Notification unsubscribe failed:", err);
    }
    setIsLoading(false);
  }, []);

  return { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe };
}
