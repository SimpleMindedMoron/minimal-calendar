import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:align-notifications@align.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// In-memory store — for production you'd store in Supabase keyed by user_id
// We use a Map: endpoint -> subscription
const subscriptions = new Map<string, webpush.PushSubscription>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, subscription } = body as {
    action: "subscribe" | "unsubscribe";
    subscription: webpush.PushSubscription;
  };

  if (action === "subscribe") {
    subscriptions.set(subscription.endpoint, subscription);
    return NextResponse.json({ success: true });
  }

  if (action === "unsubscribe") {
    subscriptions.delete(subscription.endpoint);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ count: subscriptions.size });
}

// Exported for use by the send-notifications route
export { subscriptions, webpush };
