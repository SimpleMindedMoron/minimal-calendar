import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Lazy-init VAPID so it runs at request time, not at build-time module evaluation.
// Top-level setVapidDetails() crashes the Vercel build because env vars
// are not available when Next.js imports the module to collect page config.
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

export async function POST(req: NextRequest) {
  initVapid();

  const body = await req.json();
  const { subscription, title, message, url } = body as {
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
      // Subscription has expired — client should re-subscribe
      return NextResponse.json({ error: "Subscription expired", expired: true }, { status: 410 });
    }
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
