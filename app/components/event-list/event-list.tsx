"use client";

import { format, isToday } from "date-fns";
import { Trash2 } from "lucide-react";
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

export function EventList({
  selectedDate,
  events,
  isLoading,
  onDeleteEvent,
}: Props) {
  const getMetaClass = (type: string) => {
    const t = type.toLowerCase();
    if (t === "exam") return styles.metaExam;
    if (t === "quiz") return styles.metaQuiz;
    if (t === "study") return styles.metaStudy;
    return styles.metaGeneral;
  };

  const formattedDate = selectedDate ? format(selectedDate, "MMM d") : "";
  const displayDate = selectedDate && isToday(selectedDate) ? `Today, ${formattedDate}` : formattedDate;

  return (
    <>
      <div className={styles.panelHead}>
        <h2>Agenda</h2>
        {selectedDate && <span className={styles.dateArrow}>{displayDate} →</span>}
      </div>

      <div className={styles.agendaList}>
        {isLoading ? (
          <div className={styles.emptyState}>Loading agenda...</div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>No events for {displayDate || "this date"}.</div>
        ) : (
          events.map(ev => {
            const timeFormatted = ev.event_time.slice(0, 5); // "HH:MM"
            return (
              <div key={ev.id} className={styles.agendaRow}>
                <div className={styles.agendaTime}>{timeFormatted}</div>
                <div className={styles.agendaBody}>
                  <div className={styles.title}>{ev.title}</div>
                  <div className={`${styles.meta} ${getMetaClass(ev.event_type)}`}>
                    {ev.event_type}
                  </div>
                </div>
                <button 
                  className={styles.deleteBtn} 
                  onClick={() => onDeleteEvent(ev.id)}
                  title="Delete event"
                  aria-label="Delete event"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
