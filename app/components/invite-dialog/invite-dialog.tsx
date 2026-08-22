"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Users,
  Mail,
  Send,
  ArrowLeft,
  Lock,
  Globe,
  Share2,
  Sparkles,
} from "lucide-react";
import type { Room } from "../../types/calendar";
import styles from "./invite-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeRoom: Room | null;
  rooms: Room[];
};

export function InviteDialog({ isOpen, onClose, activeRoom, rooms }: Props) {
  const [view, setView] = useState<"main" | "send">("main");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Send by Email state
  const [emailInput, setEmailInput] = useState("");
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<"idle" | "sent">("idle");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  // Room access restriction toggle: "anyone" vs "restricted"
  const [accessMode, setAccessMode] = useState<"anyone" | "restricted">("anyone");

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setView("main");
      setCopiedCode(false);
      setCopiedMessage(false);
      setEmailInput("");
      setIsEmailOpen(false);
      setEmailSentStatus("idle");
      setIsSendingEmail(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRoom = activeRoom || rooms[0];

  const handleCopyCode = async () => {
    if (!currentRoom) return;
    try {
      await navigator.clipboard.writeText(currentRoom.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = currentRoom.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getInviteMessage = () => {
    if (!currentRoom) return "";
    return `Hey! Join my shared room "${currentRoom.name}" on Minimal Calendar.\n\nRoom Invite Code: ${currentRoom.id}\n\nTo join:\n1. Open Minimal Calendar\n2. Click Manage → Join Room\n3. Paste the code above`;
  };

  const handleCopyInviteMessage = async () => {
    const msg = getInviteMessage();
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = msg;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleSendDirectEmail = async () => {
    if (!currentRoom || !emailInput.trim()) return;

    const recipientList = emailInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipientList.length === 0) return;

    setIsSendingEmail(true);
    setEmailSentStatus("idle");

    try {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: recipientList,
          roomName: currentRoom.name,
          roomId: currentRoom.id,
          accessMode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSentCount(data.sentCount || recipientList.length);
        setEmailSentStatus("sent");
        setEmailInput("");
        setTimeout(() => setEmailSentStatus("idle"), 5000);
      } else {
        alert(data.error || "Failed to send email invites. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to send invites:", err);
      alert("Failed to send automated email invites. Please check your network connection.");
    } finally {
      setIsSendingEmail(false);
    }
  };


  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {!currentRoom ? (
          <div className={styles.emptyState}>
            <p>You haven't created or joined any rooms yet.</p>
            <button className={styles.doneButton} onClick={onClose}>
              Close
            </button>
          </div>
        ) : view === "main" ? (
          /* ═════════════════════════════════════════════
             VIEW 1: MAIN INVITE CODE SCREEN
             ═════════════════════════════════════════════ */
          <>
            <div className={styles.header}>
              <div className={styles.badge}>
                <Users size={13} />
                <span>Invite Members</span>
              </div>
              <h2 id="invite-dialog-title" className={styles.title}>
                Share room access
              </h2>
              <p className={styles.subtitle}>
                Invite others to collaborate on this shared schedule.
              </p>
            </div>

            <div className={styles.body}>
              {/* Subtle Current Room Indicator: text + boxed room name */}
              <div className={styles.currentRoomInline}>
                <span className={styles.currentRoomLabel}>CURRENT ROOM:</span>
                <span className={styles.currentRoomBadge}>{currentRoom.name}</span>
              </div>

              {/* Invite Code Box (Brought to the top) */}
              <div className={styles.codeSection}>
                <div className={styles.codeHeader}>
                  <span className={styles.label}>Room Invite Code (UUID)</span>
                </div>

                <div className={styles.codeBox}>
                  <code className={styles.codeText}>{currentRoom.id}</code>
                  <button
                    type="button"
                    className={`${styles.copyButton} ${copiedCode ? styles.copied : ""}`}
                    onClick={handleCopyCode}
                    title="Copy code"
                  >
                    {copiedCode ? (
                      <>
                        <Check size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions summary */}
              <div className={styles.instructions}>
                <div className={styles.instructionStep}>
                  <span className={styles.stepNum}>1</span>
                  <span>Share this code with your teammates.</span>
                </div>
                <div className={styles.instructionStep}>
                  <span className={styles.stepNum}>2</span>
                  <span>
                    They click <strong>Manage → Join Room</strong> and paste the code.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.sendInviteMainBtn}
                  onClick={() => setView("send")}
                >
                  <Share2 size={14} />
                  <span>Send Invite Options</span>
                </button>

                <button
                  type="button"
                  className={styles.doneButton}
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ═════════════════════════════════════════════
             VIEW 2: SEND INVITE & ACCESS POPUP
             ═════════════════════════════════════════════ */
          <>
            <div className={styles.header}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => setView("main")}
                aria-label="Back to code"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <h2 id="invite-dialog-title" className={styles.title} style={{ marginTop: 10 }}>
                Send room invite
              </h2>
              <div className={styles.roomTagBanner}>
                <span>Inviting to: <strong>{currentRoom.name}</strong></span>
              </div>
            </div>

            <div className={styles.body}>
              {/* Option 1: Copy formatted message */}
              <div className={styles.optionCard}>
                <div className={styles.optionInfo}>
                  <div className={styles.optionTitleRow}>
                    <Sparkles size={14} className={styles.optionIcon} />
                    <span className={styles.optionTitle}>Copy Invite Message</span>
                  </div>
                  <p className={styles.optionDesc}>
                    Copies a formatted message with join instructions ready to paste anywhere.
                  </p>
                </div>
                <button
                  type="button"
                  className={`${styles.secondaryActionBtn} ${copiedMessage ? styles.copied : ""}`}
                  onClick={handleCopyInviteMessage}
                >
                  {copiedMessage ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Send via Email */}
              <div className={styles.optionCardColumn}>
                <div
                  className={styles.optionCardToggleRow}
                  onClick={() => setIsEmailOpen((o) => !o)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.optionInfo}>
                    <div className={styles.optionTitleRow}>
                      <Mail size={14} className={styles.optionIcon} />
                      <span className={styles.optionTitle}>Send via Email</span>
                    </div>
                    <p className={styles.optionDesc}>
                      Send automated email invitations directly with room details.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEmailOpen((o) => !o);
                    }}
                  >
                    {isEmailOpen ? "Hide" : "Open"}
                  </button>
                </div>

                {/* Email Inputs Section (Expands when clicked) */}
                {isEmailOpen && (
                  <div className={styles.emailFormArea}>
                    <label className={styles.label}>
                      Recipient Email Addresses
                    </label>
                    <textarea
                      rows={2}
                      className={styles.emailTextarea}
                      placeholder="Enter emails (e.g. teammate1@gmail.com, friend@example.com)"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      disabled={isSendingEmail}
                    />

                    {/* Access Permissions Toggle (inside Email section) */}
                    <div className={styles.accessControlBox}>
                      <div className={styles.accessHeader}>
                        <span className={styles.label}>Room Access Permission</span>
                      </div>

                      <div className={styles.toggleGroup}>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            accessMode === "anyone" ? styles.toggleBtnActive : ""
                          }`}
                          onClick={() => setAccessMode("anyone")}
                        >
                          <Globe size={13} />
                          <span>Anyone with code</span>
                        </button>

                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            accessMode === "restricted" ? styles.toggleBtnActive : ""
                          }`}
                          onClick={() => setAccessMode("restricted")}
                        >
                          <Lock size={13} />
                          <span>Only invited emails</span>
                        </button>
                      </div>

                      <p className={styles.accessDesc}>
                        {accessMode === "anyone"
                          ? "✓ Anyone with the invite code can join."
                          : "🔒 Only the email addresses entered above will be granted access."}
                      </p>
                    </div>

                    <div className={styles.emailActionsRow}>
                      <button
                        type="button"
                        className={styles.gmailSendButton}
                        onClick={handleSendDirectEmail}
                        disabled={!emailInput.trim() || isSendingEmail}
                      >
                        <Send size={13} />
                        <span>{isSendingEmail ? "Sending..." : "Send Automated Invite"}</span>
                      </button>

                      {emailSentStatus === "sent" && (
                        <span className={styles.emailSentNotice}>
                          <Check size={13} /> Sent to {sentCount} recipient{sentCount === 1 ? "" : "s"}!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setView("main")}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.doneButton}
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
