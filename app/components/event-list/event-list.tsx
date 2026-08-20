"use client";

import { format } from "date-fns";
import { Plus } from "lucide-react";
import { EventItem } from "../event-item/event-item";
import type { CalendarEvent } from "../../types/calendar";
import styles from "./event-list.module.css";

type Props = {
  selectedDate: Date | undefined;
  events: CalendarEvent[];
  isLoading: boolean;
  onDeleteEvent: (id: string) => void;
  onAddEvent: () => void;
  activeRoomName?: string;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function EventList({
  selectedDate,
  events,
  isLoading,
  onDeleteEvent,
  onAddEvent,
  activeRoomName,
}: Props) {
  const weekday  = selectedDate ? format(selectedDate, "EEEE")  : "Select a date";
  const dateStr  = selectedDate ? format(selectedDate, "MMMM d") : "";
  const isToday  = selectedDate
    ? format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    : false;

  return (
    <div className={styles.wrapper}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.greeting}>{getGreeting()}</p>
          <h1 className={styles.dayHeading}>{weekday}</h1>
          {dateStr && (
            <p className={styles.dateLine}>
              {dateStr}
              {activeRoomName
                ? ` · ${activeRoomName}`
                : " · All rooms"}
              {!isLoading && ` · ${events.length} ${events.length === 1 ? "event" : "events"}`}
            </p>
          )}
        </div>

        <div className={styles.headerRight}>
          {isToday && <span className={styles.todayBadge}>Today</span>}
          <button
            id="main-add-event"
            className={styles.addBtn}
            onClick={onAddEvent}
            aria-label="Add event"
          >
            <Plus size={16} />
            Add event
          </button>
        </div>
      </header>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className={styles.divider} />

      {/* ── Events ─────────────────────────────────────────────────── */}
      <section
        className={styles.eventsSection}
        aria-label={`Events for ${weekday}`}
      >
        {isLoading ? (
          <div className={styles.stateBox}>
            <div className={styles.spinner} aria-hidden="true" />
            <span className={styles.stateText}>Loading…</span>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.stateBox}>
            <span className={styles.emptyGlyph}>◌</span>
            <p className={styles.stateText}>
              {selectedDate ? "Nothing scheduled for this day." : "Select a date to see events."}
            </p>
            {selectedDate && (
              <button className={styles.emptyAddBtn} onClick={onAddEvent}>
                <Plus size={14} /> Add an event
              </button>
            )}
          </div>
        ) : (
          <div className={styles.eventGrid}>
            {events.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onDelete={onDeleteEvent}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
