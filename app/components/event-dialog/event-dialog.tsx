"use client";
import { useState, useEffect } from "react";
import type { EventType, Room } from "../../types/calendar";
import styles from "./event-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, time: string, type: EventType, date: string, roomId: string) => Promise<boolean>;
  rooms: Room[];
  defaultRoomId: string;
  defaultDate: string;
};
export function EventDialog({ isOpen, onClose, onSave, rooms, defaultRoomId, defaultDate }: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState<EventType>("General");
  const [date, setDate] = useState(defaultDate);
  const [roomId, setRoomId] = useState(defaultRoomId);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setTime("10:00");
      setType("General");
      setDate(defaultDate);
      setRoomId(defaultRoomId);
    }
  }, [isOpen, defaultDate, defaultRoomId]);
  if (!isOpen) return null;
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await onSave(title, time, type, date, roomId)) {
      onClose();
    }
  };
  return (
    <div className={styles.backdrop} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
      >
        <h2 id="event-dialog-title" className={styles.title}>
          Add Event
        </h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Title
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Date
              <input
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              Time
              <input
                type="time"
                required
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Calendar
              <select
                required
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Type
              <input
                type="text"
                required
                placeholder="e.g. Lecture"
                value={type}
                onChange={(event) => setType(event.target.value)}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
