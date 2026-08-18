import { Trash2 } from "lucide-react";
import type { CalendarEvent } from "../../types/calendar";
import styles from "./event-item.module.css";

export function EventItem({ event, onDelete }: { event: CalendarEvent; onDelete: (id: string) => void }) {
  return <article className={styles.item}><span className={`${styles.indicator} ${styles[event.event_type]}`} /><div className={styles.details}><h3 className={styles.title}>{event.title}</h3><p className={styles.type}>{event.event_type}</p></div><time className={styles.time}>{event.event_time.slice(0, 5)}</time><button type="button" onClick={() => onDelete(event.id)} className={styles.deleteButton} title="Delete event" aria-label={`Delete ${event.title}`}><Trash2 size={16} /></button></article>;
}
