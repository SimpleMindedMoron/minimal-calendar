"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CalendarEvent } from "../types/calendar";

// ─── LocalStorage helpers ───────────────────────────────────────────────────

const NOTIF_ENABLED_KEY = "align_notif_enabled";
const NOTIF_SENT_KEY = "align_notifications_sent";

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
  localStorage.setItem(NOTIF_SENT_KEY, JSON.stringify(Array.from(set).slice(-200)));
}

function wasAlreadySent(key: string): boolean {
  return getSentSet().has(key);
}

// ─── Notification display ────────────────────────────────────────────────────

async function showNotification(title: string, body: string) {
  if (Notification.permission !== "granted") return;

  // Prefer SW notification — it renders even if the tab isn't focused
  if ("serviceWorker" in navigator) {
    try {
      const reg = await Promise.race<ServiceWorkerRegistration | null>([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          tag: "align-event",
        });
        return;
      }
    } catch {
      // fall through to direct API
    }
  }

  // Fallback: direct Notification API (works when tab is in focus)
  new Notification(title, {
    body,
    icon: "/icons/icon-192x192.png",
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(events: CalendarEvent[]) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const schedulerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // On mount — check support and restore persisted state
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    setIsSupported(true);
    const currentPerm = Notification.permission;
    setPermission(currentPerm);

    // Restore "enabled" from localStorage only if permission is still granted
    if (currentPerm === "granted") {
      const saved = localStorage.getItem(NOTIF_ENABLED_KEY);
      if (saved === "true") setIsSubscribed(true);
    } else {
      // Permission was revoked by user — clean up saved state
      localStorage.removeItem(NOTIF_ENABLED_KEY);
    }
  }, []);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      // Request browser permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        // User denied — nothing more we can do
        setIsLoading(false);
        return false;
      }

      // Mark enabled and update state
      localStorage.setItem(NOTIF_ENABLED_KEY, "true");
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("[Align] Failed to enable notifications:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  // ── Unsubscribe ────────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    localStorage.removeItem(NOTIF_ENABLED_KEY);
    setIsSubscribed(false);
    schedulerRef.current.forEach(clearTimeout);
    schedulerRef.current = [];
  }, []);

  // ── Schedule notifications for events ─────────────────────────────────────
  const scheduleEventNotifications = useCallback(() => {
    if (!isSubscribed || permission !== "granted") return;

    // Clear stale timers before rescheduling
    schedulerRef.current.forEach(clearTimeout);
    schedulerRef.current = [];

    const now = Date.now();

    events.forEach((event) => {
      if (!event.event_date || !event.event_time) return;

      const [year, month, day] = event.event_date.split("-").map(Number);
      const [hour, minute] = event.event_time.split(":").map(Number);

      const notificationTimes = [
        {
          timing: "3day",
          // Fire at 09:00 local time, 3 days before the event
          fireAt: new Date(year, month - 1, day - 3, 9, 0, 0).getTime(),
          label: `in 3 days`,
        },
        {
          timing: "day-of",
          // Fire at 09:00 on the day of the event (or 2h before if event < 09:00)
          fireAt: new Date(year, month - 1, day, hour > 2 ? Math.min(9, hour - 2) : 7, 0, 0).getTime(),
          label: "today",
        },
      ];

      notificationTimes.forEach(({ timing, label, fireAt }) => {
        const key = `${event.id}:${timing}`;
        if (wasAlreadySent(key)) return;
        if (fireAt <= now) return; // Already past

        const delay = fireAt - now;
        // Only schedule within the next 24h — hourly re-runs catch the rest
        if (delay > 24 * 60 * 60 * 1000) return;

        const timer = setTimeout(async () => {
          if (wasAlreadySent(key)) return; // Guard against duplicates
          markSent(key);
          await showNotification(
            "📅 Upcoming Event — Align",
            `"${event.title}" is happening ${label}${label === "today" ? "" : ` — ${event.event_date}`}`
          );
        }, delay);

        schedulerRef.current.push(timer);
      });
    });
  }, [isSubscribed, permission, events]);

  // Re-run scheduler when events or subscription state changes
  useEffect(() => {
    scheduleEventNotifications();
    return () => {
      schedulerRef.current.forEach(clearTimeout);
    };
  }, [scheduleEventNotifications]);

  // Hourly re-check — catches events that move into the 24h scheduling window
  useEffect(() => {
    if (!isSubscribed || permission !== "granted") return;
    const interval = setInterval(scheduleEventNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isSubscribed, permission, scheduleEventNotifications]);

  return { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe };
}
