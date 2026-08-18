import { format } from "date-fns";
import { EventItem } from "../event-item/event-item";
import type { CalendarEvent } from "../../types/calendar";
import styles from "./event-list.module.css";

type Props = { selectedDate: Date | undefined; events: CalendarEvent[]; isLoading: boolean; onDeleteEvent: (id: string) => void };
export function EventList({ selectedDate, events, isLoading, onDeleteEvent }: Props) {
  return <section className={styles.events}><h2 className={styles.heading}>{selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}</h2><div className={styles.list}>{isLoading ? <p className={styles.message}>Loading events...</p> : events.length === 0 ? <p className={styles.message}>No events scheduled for this day.</p> : events.map((event) => <EventItem key={event.id} event={event} onDelete={onDeleteEvent} />)}</div></section>;
}
