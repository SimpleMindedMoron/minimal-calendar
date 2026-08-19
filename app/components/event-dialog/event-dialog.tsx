"use client";
import { useState } from "react";
import type { EventType } from "../../types/calendar";
import styles from "./event-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, time: string, type: EventType) => Promise<boolean>;
};
export function EventDialog({ isOpen, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState<EventType>("exam");
  if (!isOpen) return null;
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await onSave(title, time, type)) {
      setTitle("");
      setTime("10:00");
      setType("exam");
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
              Time
              <input
                type="time"
                required
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value as EventType)}
              >
                <option value="exam">Exam</option>
                <option value="quiz">Quiz</option>
                <option value="study">Study Session</option>
              </select>
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
