"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CalendarEvent } from "../types/calendar";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  message: string,
  url?: string
) {
  try {
    await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: JSON.parse(JSON.stringify(subscription)), title, message, url }),
    });
  } catch (err) {
    console.error("Failed to send push notification:", err);
  }
}

// Keys for localStorage
const NOTIF_SUBSCRIPTION_KEY = "align_push_subscription";
const NOTIF_SENT_KEY = "align_notifications_sent"; // Set of "eventId:timing" already sent

function getSentSet(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIF_SENT_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markSent(key: string) {
  const set = getSentSet();
  set.add(key);
  // Prune old entries (keep only last 200)
  const arr = Array.from(set).slice(-200);
  localStorage.setItem(NOTIF_SENT_KEY, JSON.stringify(arr));
}

function wasAlreadySent(key: string): boolean {
  return getSentSet().has(key);
}

export function useNotifications(events: CalendarEvent[]) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const schedulerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Initialize: check support and restore saved subscription
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setIsSupported(true);
    setPermission(Notification.permission);

    // Try to restore active subscription
    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setSubscription(existing);
        }
      } catch {
        // SW not ready yet
      }
    })();
  }, []);

  // Subscribe to push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setIsLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key not configured");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });

      setSubscription(sub);

      // Register with our server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", subscription: JSON.parse(JSON.stringify(sub)) }),
      });

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Failed to subscribe:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    setIsLoading(true);
    try {
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe", subscription: JSON.parse(JSON.stringify(subscription)) }),
      });
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
    }
    setIsLoading(false);
  }, [subscription]);

  // Schedule notifications for upcoming events
  const scheduleEventNotifications = useCallback(() => {
    if (!subscription || permission !== "granted") return;

    // Clear any pending timers
    schedulerRef.current.forEach(clearTimeout);
    schedulerRef.current = [];

    const now = Date.now();

    events.forEach((event) => {
      if (!event.event_date || !event.event_time) return;

      // Parse event datetime in local time
      const [year, month, day] = event.event_date.split("-").map(Number);
      const [hour, minute] = event.event_time.split(":").map(Number);
      const eventMs = new Date(year, month - 1, day, hour, minute, 0).getTime();

      // Compute notification times
      const notificationTimes: { timing: string; label: string; fireAt: number }[] = [
        {
          timing: "3day",
          label: "3 days",
          // Fire at 9:00 AM local time, 3 days before the event
          fireAt: new Date(year, month - 1, day - 3, 9, 0, 0).getTime(),
        },
        {
          timing: "day-of",
          label: "today",
          // Fire at 9:00 AM on the day of the event (or event time - 2hr if event is before 9am)
          fireAt: new Date(year, month - 1, day, Math.min(9, hour > 2 ? hour - 2 : 0), 0, 0).getTime(),
        },
      ];

      notificationTimes.forEach(({ timing, label, fireAt }) => {
        const key = `${event.id}:${timing}`;

        // Don't re-send already sent notifications
        if (wasAlreadySent(key)) return;

        // Don't schedule past notifications
        if (fireAt <= now) return;

        // Only schedule up to 24h in advance (browser timer limitation for precision)
        const delay = fireAt - now;
        if (delay > 24 * 60 * 60 * 1000) return; // Will be picked up in next daily check

        const timer = setTimeout(async () => {
          if (wasAlreadySent(key)) return; // Double-check
          markSent(key);
          await sendPushNotification(
            subscription,
            "📅 Upcoming Event",
            `"${event.title}" is happening ${label}${label === "today" ? "" : " — " + event.event_date}`,
            "/"
          );
        }, delay);

        schedulerRef.current.push(timer);
      });
    });
  }, [subscription, permission, events]);

  // Re-run scheduler whenever events or subscription changes
  useEffect(() => {
    scheduleEventNotifications();
    return () => {
      schedulerRef.current.forEach(clearTimeout);
    };
  }, [scheduleEventNotifications]);

  // Daily re-check: reschedule every hour to catch new events and events > 24h away
  useEffect(() => {
    if (!subscription || permission !== "granted") return;
    const interval = setInterval(() => {
      scheduleEventNotifications();
    }, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, [subscription, permission, scheduleEventNotifications]);

  return {
    isSupported,
    isSubscribed: !!subscription,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
