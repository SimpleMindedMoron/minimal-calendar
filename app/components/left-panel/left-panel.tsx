"use client";

import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { Copy, Trash2 } from "lucide-react";
import { CalendarPanel } from "../calendar-panel/calendar-panel";
import type { Room, CalendarEvent } from "../../types/calendar";
import styles from "./left-panel.module.css";

type Props = {
  rooms: Room[];
  activeRoom: Room | null;
  onSelectRoom: (room: Room | null) => void;
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  eventDates: string[];
  upcomingEvents: CalendarEvent[];
  onDeleteRoom: () => void;
};

const ROOM_COLORS = [
  "var(--accent)",
  "var(--positive)",
  "var(--event-exam)",
  "var(--event-general)",
];

function getDateLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE d");
  } catch {
    return dateStr;
  }
}

function getEventAccent(type: string): string {
  const t = type.toLowerCase();
  if (t === "exam")  return "var(--event-exam)";
  if (t === "study") return "var(--event-study)";
  if (t === "quiz")  return "var(--event-quiz)";
  return "var(--event-general)";
}

export function LeftPanel({
  rooms,
  activeRoom,
  onSelectRoom,
  selectedDate,
  onSelectDate,
  eventDates,
  upcomingEvents,
  onDeleteRoom,
}: Props) {
  const handleCopy = () => {
    if (activeRoom) {
      navigator.clipboard.writeText(activeRoom.id);
    }
  };

  return (
    <aside className={styles.panel} aria-label="Calendar sidebar">
      {/* App name */}
      <div className={styles.appName}>
        <span className={styles.appNameText}>Agendly</span>
      </div>

      {/* Mini calendar */}
      <div className={styles.calendarWrap}>
        <CalendarPanel
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          eventDates={eventDates}
        />
      </div>

      {/* Rooms section */}
      <div className={styles.section}>
        <div className={styles.sectionRow}>
          <span className={styles.sectionLabel}>Rooms</span>
          {activeRoom && (
            <div className={styles.roomActions}>
              <button
                className={styles.roomActionBtn}
                onClick={handleCopy}
                title="Copy invite code"
                aria-label="Copy invite code"
              >
                <Copy size={12} />
              </button>
              {activeRoom.role === "admin" && (
                <button
                  className={`${styles.roomActionBtn} ${styles.roomActionDanger}`}
                  onClick={onDeleteRoom}
                  title="Delete room"
                  aria-label="Delete room"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <nav className={styles.roomList} aria-label="Rooms">
          <button
            className={`${styles.roomBtn} ${!activeRoom ? styles.roomBtnActive : ""}`}
            onClick={() => onSelectRoom(null)}
          >
            <span
              className={styles.roomDot}
              style={{ background: "var(--accent)" }}
            />
            <span className={styles.roomBtnLabel}>All rooms</span>
            {!activeRoom && <span className={styles.activePill}>active</span>}
          </button>

          {rooms.map((room, i) => {
            const color = ROOM_COLORS[i % ROOM_COLORS.length];
            const isActive = activeRoom?.id === room.id;
            return (
              <button
                key={room.id}
                className={`${styles.roomBtn} ${isActive ? styles.roomBtnActive : ""}`}
                onClick={() => onSelectRoom(room)}
              >
                <span className={styles.roomDot} style={{ background: color }} />
                <span className={styles.roomBtnLabel}>{room.name}</span>
                {isActive && <span className={styles.activePill}>active</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Upcoming mini list */}
      {upcomingEvents.length > 0 && (
        <div className={`${styles.section} ${styles.upcomingSection}`}>
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Coming up</span>
          </div>
          <div className={styles.upcomingList}>
            {upcomingEvents.slice(0, 6).map((ev) => (
              <div key={ev.id} className={styles.upcomingItem}>
                <span
                  className={styles.upcomingAccent}
                  style={{ background: getEventAccent(ev.event_type) }}
                />
                <div className={styles.upcomingBody}>
                  <span className={styles.upcomingTitle}>{ev.title}</span>
                  <span className={styles.upcomingMeta}>
                    {getDateLabel(ev.event_date)} · {ev.event_time.slice(0, 5)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
