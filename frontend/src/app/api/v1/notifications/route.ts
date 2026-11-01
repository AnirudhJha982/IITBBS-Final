import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationHistory,
  sendNotification,
  getUserPreferences,
  setUserPreferences,
} from "@/lib/notifications";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? verifyToken(token) : null;
  const searchParams = req.nextUrl.searchParams;
  const recipient = searchParams.get("recipient") || user?.email || undefined;

  const history = getNotificationHistory(recipient);
  const preferences = user ? getUserPreferences(user.email) : getUserPreferences("default");

  return NextResponse.json({
    success: true,
    total: history.length,
    notifications: history,
    preferences,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? verifyToken(token) : null;

  try {
    const body = await req.json().catch(() => ({}));
    const { recipient, category, title, message, channels, metadata } = body;

    if (!recipient || !title || !message) {
      return NextResponse.json(
        { success: false, message: "recipient, title, and message are required." },
        { status: 400 }
      );
    }

    const records = await sendNotification({
      recipient,
      category: category || "emergency_alert",
      title,
      message,
      channels,
      metadata: { ...metadata, sender_id: user?.userId || "anonymous" },
    });

    return NextResponse.json({
      success: true,
      delivered_count: records.filter((r) => r.status === "delivered").length,
      records,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to dispatch notification." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const updated = setUserPreferences(user.email, body);
  return NextResponse.json({ success: true, preferences: updated });
}

