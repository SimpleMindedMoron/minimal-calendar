export type EventType = "exam" | "quiz" | "study";
export type CalendarEvent = { id: string; title: string; event_date: string; event_time: string; event_type: EventType };
