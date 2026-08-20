import { Trash2 } from "lucide-react";
import type { CalendarEvent } from "../../types/calendar";
import styles from "./event-item.module.css";

type EventColour = {
  bar:  string;
  bg:   string;
  chip: string;
  chipText: string;
};

function getColour(type: string): EventColour {
  const t = type.toLowerCase();
  if (t === "exam") return {
    bar:      "var(--event-exam)",
    bg:       "var(--event-exam-bg)",
    chip:     "var(--event-exam-dim)",
    chipText: "var(--event-exam)",
  };
  if (t === "study") return {
    bar:      "var(--event-study)",
    bg:       "var(--event-study-bg)",
    chip:     "var(--event-study-dim)",
    chipText: "var(--event-study)",
  };
  if (t === "quiz") return {
    bar:      "var(--event-quiz)",
    bg:       "var(--event-quiz-bg)",
    chip:     "var(--event-quiz-dim)",
    chipText: "var(--event-quiz)",
  };
  return {
    bar:      "var(--event-general)",
    bg:       "var(--event-general-bg)",
    chip:     "var(--event-general-dim)",
    chipText: "var(--event-general)",
  };
}

export function EventItem({
  event,
  onDelete,
}: {
  event: CalendarEvent;
  onDelete: (id: string) => void;
}) {
  const colour = getColour(event.event_type);

  return (
    <article
      className={styles.card}
      style={{
        "--bar-color": colour.bar,
        "--bg-color":  colour.bg,
        "--chip-bg":   colour.chip,
        "--chip-text": colour.chipText,
      } as React.CSSProperties}
    >
      {/* Coloured left bar */}
      <span className={styles.bar} aria-hidden="true" />

      {/* Content */}
      <div className={styles.body}>
        <div className={styles.topRow}>
          <h3 className={styles.title}>{event.title}</h3>
          <time className={styles.time} dateTime={event.event_time}>
            {event.event_time.slice(0, 5)}
          </time>
        </div>

        <div className={styles.bottomRow}>
          <span className={styles.chip}>{event.event_type}</span>
        </div>
      </div>

      {/* Delete */}
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={() => onDelete(event.id)}
        aria-label={`Delete ${event.title}`}
        title="Delete event"
      >
        <Trash2 size={14} />
      </button>
    </article>
  );
}
