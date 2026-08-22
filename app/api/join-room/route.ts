import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PERMISSIONS_FILE = path.join(process.cwd(), "data", "room-permissions.json");

function getPermissions(): Record<string, { accessMode: string; invitedEmails: string[] }> {
  try {
    if (fs.existsSync(PERMISSIONS_FILE)) {
      const data = fs.readFileSync(PERMISSIONS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading room permissions:", err);
  }
  return {};
}

export async function POST(req: Request) {
  try {
    const { calendarId, userEmail } = await req.json();

    if (!calendarId) {
      return NextResponse.json(
        { error: "Calendar ID is required." },
        { status: 400 }
      );
    }

    const permissions = getPermissions();
    const roomPermission = permissions[calendarId];

    // If no permission restriction or accessMode is "anyone", allow
    if (!roomPermission || roomPermission.accessMode !== "restricted") {
      return NextResponse.json({ allowed: true });
    }

    // Room is restricted: check if user's email was invited
    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const invitedList = (roomPermission.invitedEmails || []).map((e) =>
      e.trim().toLowerCase()
    );

    if (!cleanEmail || !invitedList.includes(cleanEmail)) {
      return NextResponse.json(
        {
          allowed: false,
          error: `Access restricted: This room allows specifically invited email accounts only. Your account (${cleanEmail || "unknown"}) was not on the invite list.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ allowed: true });
  } catch (error: any) {
    console.error("Error in /api/join-room:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify room access." },
      { status: 500 }
    );
  }
}
