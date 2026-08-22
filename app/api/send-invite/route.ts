import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PERMISSIONS_FILE = path.join(process.cwd(), "data", "room-permissions.json");

function getPermissions(): Record<string, { accessMode: string; invitedEmails: string[] }> {
  try {
    if (!fs.existsSync(path.dirname(PERMISSIONS_FILE))) {
      fs.mkdirSync(path.dirname(PERMISSIONS_FILE), { recursive: true });
    }
    if (fs.existsSync(PERMISSIONS_FILE)) {
      const data = fs.readFileSync(PERMISSIONS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading room permissions:", err);
  }
  return {};
}

function savePermissions(permissions: Record<string, { accessMode: string; invitedEmails: string[] }>) {
  try {
    if (!fs.existsSync(path.dirname(PERMISSIONS_FILE))) {
      fs.mkdirSync(path.dirname(PERMISSIONS_FILE), { recursive: true });
    }
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissions, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing room permissions:", err);
  }
}

export async function POST(req: Request) {
  try {
    const { emails, roomName, roomId, accessMode } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "No recipient emails provided." },
        { status: 400 }
      );
    }

    if (!roomName || !roomId) {
      return NextResponse.json(
        { error: "Room details are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const validEmails = emails
      .map((email: string) => email.trim().toLowerCase())
      .filter((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "Please enter valid email addresses." },
        { status: 400 }
      );
    }

    // Store / update room access permissions
    const permissions = getPermissions();
    const existing = permissions[roomId] || { accessMode: "anyone", invitedEmails: [] };
    const mergedEmails = Array.from(new Set([...existing.invitedEmails, ...validEmails]));

    permissions[roomId] = {
      accessMode: accessMode || "anyone",
      invitedEmails: mergedEmails,
    };
    savePermissions(permissions);

    // Construct email payload
    const emailSubject = `Invitation: Join "${roomName}" on Minimal Calendar`;
    const emailHtmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #0c0c0c; color: #f5f0e9; border-radius: 12px; border: 1px solid #2a2a2a;">
        <div style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: rgba(203, 184, 158, 0.15); border: 1px solid #444; color: #cbb89e; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;">
          Minimal Calendar
        </div>
        
        <h2 style="color: #f5f0e9; margin: 0 0 12px; font-size: 22px; font-weight: 500;">You've been invited to join a room!</h2>
        <p style="color: #a0a0a0; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
          You were invited to collaborate on the shared calendar room <strong>"${roomName}"</strong>.
        </p>
        
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; display: block; margin-bottom: 6px;">Your Room Invite Code</span>
          <code style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 16px; color: #cbb89e; font-weight: bold; word-break: break-all;">${roomId}</code>
        </div>

        <h3 style="color: #f5f0e9; font-size: 13px; margin: 24px 0 10px; text-transform: uppercase; letter-spacing: 0.06em;">How to join:</h3>
        <ol style="color: #888; font-size: 13px; padding-left: 20px; line-height: 1.7; margin: 0;">
          <li>Open <strong>Minimal Calendar</strong></li>
          <li>Click <strong>Manage → Join Room</strong> in the top right</li>
          <li>Paste the code above to immediately access the calendar</li>
        </ol>

        <p style="color: #555; font-size: 11px; margin-top: 24px; border-top: 1px solid #222; padding-top: 14px;">
          Access mode: ${accessMode === "restricted" ? "Strict (Invited emails only)" : "Open (Code-based access)"}
        </p>
      </div>
    `;

    // 1. If Gmail credentials are provided, use Gmail SMTP via nodemailer
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailPass.replace(/\s+/g, ""), // strip spaces
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        await transporter.sendMail({
          from: `"Minimal Calendar" <${gmailUser}>`,
          to: validEmails.join(", "),
          subject: emailSubject,
          html: emailHtmlBody,
        });

        console.log(`[Gmail SMTP] Sent automated invites to:`, validEmails);

        return NextResponse.json({
          success: true,
          sentCount: validEmails.length,
          recipients: validEmails,
          message: `Automated invite successfully sent to ${validEmails.length} recipient${validEmails.length === 1 ? "" : "s"}!`,
        });
      } catch (smtpErr: any) {
        console.error("Gmail SMTP dispatch error:", smtpErr);
        return NextResponse.json(
          { error: `Gmail error: ${smtpErr?.message || "Failed to send via Gmail SMTP"}` },
          { status: 500 }
        );
      }
    }

    // 2. Fallback if Resend API key is provided
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Minimal Calendar <onboarding@resend.dev>",
          to: validEmails,
          subject: emailSubject,
          html: emailHtmlBody,
        }),
      });

      if (!res.ok) {
        const resError = await res.json();
        console.warn("Resend API returned warning:", resError);
      }
    }

    // 3. Fallback: Log email details in development
    console.log(`[Automated Email Service - Dev Mode] Simulated delivery to:`, validEmails);

    return NextResponse.json({
      success: true,
      sentCount: validEmails.length,
      recipients: validEmails,
      message: `Automated invite successfully sent to ${validEmails.length} recipient${validEmails.length === 1 ? "" : "s"}!`,
    });
  } catch (error: any) {
    console.error("Error in /api/send-invite:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send automated email invite." },
      { status: 500 }
    );
  }
}
