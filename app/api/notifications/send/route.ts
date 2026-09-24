import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:align-notifications@align.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// In-memory subscription store shared with the subscribe route.
// NOTE: Since Next.js route modules are separate, we keep a local copy here too.
// For production, store subscriptions in Supabase.
const subscriptions = new Map<string, webpush.PushSubscription>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    subscription,
    title,
    message,
    url,
  } = body as {
    subscription: webpush.PushSubscription;
    title: string;
    message: string;
    url?: string;
  };

  if (!subscription) {
    return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
  }

  const payload = JSON.stringify({
    title: title || "Align",
    body: message,
    icon: "/icons/icon-192x192.png",
    url: url || "/",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    console.error("Push notification error:", err);
    if (error.statusCode === 410) {
      // Subscription expired — remove it
      subscriptions.delete(subscription.endpoint);
    }
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
