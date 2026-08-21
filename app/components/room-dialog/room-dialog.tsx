"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "./room-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string | null;
};

export function RoomDialog({ isOpen, onClose, onSuccess, userId }: Props) {
  const [mode, setMode] = useState<"create" | "join">("create");
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
    } else {
      // Join an existing room via UUID
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
          "Could not join room. Please check if the invite code is correct.",
        );
      }
    }

    setLoading(false);
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="room-dialog-title">
        <div className={styles.header}>
          <h2 id="room-dialog-title" className={styles.title}>Your rooms</h2>
          <p className={styles.subtitle}>Create a shared space or join one with an invite code.</p>
        </div>
        
        <div className={styles.tabs}>
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
      </div>
    </div>
  );
}
