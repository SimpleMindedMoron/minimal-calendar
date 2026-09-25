import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { format, addDays, startOfDay } from "date-fns";

let vapidInitialised = false;
function initVapid() {
  if (vapidInitialised) return;
  webpush.setVapidDetails(
    "mailto:align-notifications@align.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidInitialised = true;
}

// This route is called by Vercel Cron daily at 9:00 AM IST (03:30 UTC)
// It also accepts a POST from the client as a manual trigger (dev/test)
export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel Cron call
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return sendScheduledNotifications();
}

// Allow manual POST for testing (no auth required in dev)
export async function POST() {
  return sendScheduledNotifications();
}

async function sendScheduledNotifications() {
  initVapid();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const threeDaysStr = format(addDays(today, 3), "yyyy-MM-dd");

  // Fetch events happening today or in 3 days
  const { data: events, error: eventsError } = await admin
    .from("events")
    .select("id, title, event_date, event_time, calendar_id")
    .in("event_date", [todayStr, threeDaysStr]);

  if (eventsError || !events?.length) {
    return NextResponse.json({ sent: 0, message: "No events to notify" });
  }

  // Fetch all push subscriptions and calendar memberships in one go
  const calendarIds = [...new Set(events.map((e) => e.calendar_id as string))];

  const { data: members } = await admin
    .from("calendar_members")
    .select("user_id, calendar_id")
    .in("calendar_id", calendarIds);

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (!members?.length || !subscriptions?.length) {
    return NextResponse.json({ sent: 0, message: "No subscriptions found" });
  }

  // Build lookup: user_id → subscriptions
  const subsByUser = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions) {
    const existing = subsByUser.get(sub.user_id) ?? [];
    existing.push(sub);
    subsByUser.set(sub.user_id, existing);
  }

  // Build lookup: calendar_id → user_ids
  const usersByCalendar = new Map<string, string[]>();
  for (const m of members) {
    const existing = usersByCalendar.get(m.calendar_id) ?? [];
    existing.push(m.user_id);
    usersByCalendar.set(m.calendar_id, existing);
  }

  let sent = 0;
  const expired: string[] = [];

  for (const event of events) {
    const isToday = event.event_date === todayStr;
    const label = isToday ? "today" : "in 3 days";
    const timeStr = (event.event_time as string).slice(0, 5);

    const payload = JSON.stringify({
      title: "📅 Upcoming Event — Align",
      body: `"${event.title}" is happening ${label} at ${timeStr}`,
      icon: "/icons/icon-192x192.png",
      url: "/",
    });

    const calendarUsers = usersByCalendar.get(event.calendar_id) ?? [];

    for (const userId of calendarUsers) {
      const userSubs = subsByUser.get(userId) ?? [];
      for (const sub of userSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: unknown) {
          const e = err as { statusCode?: number };
          if (e.statusCode === 410 || e.statusCode === 404) {
            // Subscription expired — queue for cleanup
            expired.push(sub.endpoint);
          } else {
            console.error("Push send error:", err);
          }
        }
      }
    }
  }

  // Clean up expired subscriptions
  if (expired.length) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expired);
  }

  return NextResponse.json({ sent, expired: expired.length });
}
