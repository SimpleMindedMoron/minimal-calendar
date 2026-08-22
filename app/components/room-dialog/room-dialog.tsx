"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { Room } from "../../types/calendar";
import styles from "./room-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string | null;
  rooms?: Room[];
  onLeaveRoom?: (roomId: string) => Promise<void>;
};

export function RoomDialog({
  isOpen,
  onClose,
  onSuccess,
  userId,
  rooms = [],
  onLeaveRoom,
}: Props) {
  const [mode, setMode] = useState<"rooms" | "create" | "join">(
    rooms.length > 0 ? "rooms" : "create"
  );
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !inputValue.trim()) return;

    setLoading(true);

    if (mode === "create") {
      // 1. Create the room and retrieve the generated UUID
      const { data: newRoom, error: roomError } = await supabase
        .from("calendars")
        .insert([{ name: inputValue.trim() }])
        .select()
        .single();

      if (!roomError && newRoom) {
        // 2. Add the creator as an admin
        const { error: memberError } = await supabase
          .from("calendar_members")
          .insert([
            { calendar_id: newRoom.id, user_id: userId, role: "admin" },
          ]);

        if (!memberError) {
          onSuccess();
          onClose();
          setInputValue("");
        } else {
          alert("Room created, but failed to assign admin role.");
        }
      } else {
        alert("Failed to create room.");
      }
    } else if (mode === "join") {
      try {
        // 1. Get current logged-in user's email
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData?.user?.email || "";

        // 2. Check access permissions with backend API
        const checkRes = await fetch("/api/join-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calendarId: inputValue.trim(),
            userEmail,
          }),
        });

        const checkData = await checkRes.json();

        if (!checkRes.ok || !checkData.allowed) {
          alert(
            checkData.error ||
              "Access restricted: This room allows specifically invited email accounts only."
          );
          setLoading(false);
          return;
        }

        // 3. If allowed, join room via UUID
        const { error } = await supabase
          .from("calendar_members")
          .insert([
            { calendar_id: inputValue.trim(), user_id: userId, role: "viewer" },
          ]);

        if (!error) {
          onSuccess();
          onClose();
          setInputValue("");
        } else {
          alert(
            "Could not join room. Please check if the invite code is correct or if you are already a member."
          );
        }
      } catch (err: any) {
        console.error("Error joining room:", err);
        alert("Failed to join room. Please check your network connection.");
      }
    }

    setLoading(false);
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="room-dialog-title" className={styles.title}>
            Manage Rooms
          </h2>
          <p className={styles.subtitle}>
            Create, join, or leave shared calendar spaces.
          </p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === "rooms" ? styles.activeTab : ""}`}
            onClick={() => {
              setMode("rooms");
              setInputValue("");
            }}
          >
            My Rooms ({rooms.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === "create" ? styles.activeTab : ""}`}
            onClick={() => {
              setMode("create");
              setInputValue("");
            }}
          >
            Create Room
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === "join" ? styles.activeTab : ""}`}
            onClick={() => {
              setMode("join");
              setInputValue("");
            }}
          >
            Join Room
          </button>
        </div>

        {mode === "rooms" ? (
          <div className={styles.roomsListContainer}>
            {rooms.length === 0 ? (
              <div className={styles.emptyRoomsNotice}>
                <p>You haven't joined any rooms yet.</p>
              </div>
            ) : (
              <div className={styles.roomsList}>
                {rooms.map((r) => (
                  <div key={r.id} className={styles.roomRow}>
                    <div className={styles.roomRowInfo}>
                      <span className={styles.roomRowName}>{r.name}</span>
                      <span className={styles.roomRowRole}>{r.role}</span>
                    </div>
                    {onLeaveRoom && (
                      <button
                        type="button"
                        className={styles.leaveRoomRowBtn}
                        onClick={async () => {
                          await onLeaveRoom(r.id);
                        }}
                      >
                        Leave
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.doneButton}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>
              {mode === "create" ? "Room Name" : "Invite Code (UUID)"}
              <input
                type="text"
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  mode === "create"
                    ? "e.g., Computer Science 101"
                    : "Paste unique code here"
                }
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : mode === "create"
                  ? "Create Room"
                  : "Join Room"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
