"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Users, Sparkles } from "lucide-react";
import type { Room } from "../../types/calendar";
import styles from "./invite-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeRoom: Room | null;
  rooms: Room[];
};

export function InviteDialog({ isOpen, onClose, activeRoom, rooms }: Props) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Sync selected room when activeRoom or rooms change
  useEffect(() => {
    if (activeRoom) {
      setSelectedRoomId(activeRoom.id);
    } else if (rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [activeRoom, rooms, isOpen]);

  // Reset copied status when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCopiedCode(false);
      setCopiedMessage(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || activeRoom || rooms[0];

  const handleCopyCode = async () => {
    if (!currentRoom) return;
    try {
      await navigator.clipboard.writeText(currentRoom.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
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

  const handleCopyInviteMessage = async () => {
    if (!currentRoom) return;
    const msg = `Join my room "${currentRoom.name}" on Minimal Calendar with invite code:\n${currentRoom.id}`;
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

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.badge}>
            <Users size={13} />
            <span>Invite Members</span>
          </div>
          <h2 id="invite-dialog-title" className={styles.title}>
            Share room access
          </h2>
          <p className={styles.subtitle}>
            Anyone with this invite code can join and view this shared calendar.
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't created or joined any rooms yet.</p>
            <button className={styles.doneButton} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div className={styles.body}>
            {/* Room Selector if user has multiple rooms */}
            {rooms.length > 1 && (
              <div className={styles.roomSelectSection}>
                <label htmlFor="invite-room-select" className={styles.label}>
                  Select Room
                </label>
                <select
                  id="invite-room-select"
                  className={styles.select}
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    setCopiedCode(false);
                    setCopiedMessage(false);
                  }}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.role === "admin" ? "(Admin)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentRoom && (
              <>
                <div className={styles.codeSection}>
                  <div className={styles.codeHeader}>
                    <span className={styles.label}>Invite Code (Room ID)</span>
                    <span className={styles.roomTag}>{currentRoom.name}</span>
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

                <div className={styles.instructions}>
                  <div className={styles.instructionStep}>
                    <span className={styles.stepNum}>1</span>
                    <span>Send this code to your friends or teammates.</span>
                  </div>
                  <div className={styles.instructionStep}>
                    <span className={styles.stepNum}>2</span>
                    <span>
                      They open Minimal Calendar and click <strong>Manage → Join Room</strong>.
                    </span>
                  </div>
                  <div className={styles.instructionStep}>
                    <span className={styles.stepNum}>3</span>
                    <span>Paste the code to immediately access the calendar events!</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleCopyInviteMessage}
                  >
                    {copiedMessage ? (
                      <>
                        <Check size={14} />
                        <span>Message Copied!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Copy Full Invite Message</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className={styles.doneButton}
                    onClick={onClose}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
