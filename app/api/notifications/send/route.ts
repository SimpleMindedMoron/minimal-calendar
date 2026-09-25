import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

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

  const body = await req.json() as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    title: string;
    message: string;
    url?: string;
  };

  if (!body.subscription?.endpoint) {
    return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
  }

  const payload = JSON.stringify({
    title: body.title || "Align",
    body: body.message,
    icon: "/icons/icon-192x192.png",
    url: body.url || "/",
  });

  try {
    await webpush.sendNotification(
      { endpoint: body.subscription.endpoint, keys: body.subscription.keys },
      payload
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    console.error("Push notification error:", err);
    return NextResponse.json(
      { error: "Failed to send", expired: e.statusCode === 410 },
      { status: e.statusCode === 410 ? 410 : 500 }
    );
  }
}
