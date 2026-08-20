export type EventType = string;

export type Room = {
  id: string;
  name: string;
  role: "admin" | "contributor" | "viewer";
};

export type CalendarEvent = {
  id: string;
  calendar_id: string;
  title: string;
  event_date: string;
  event_time: string;
  event_type: EventType;
};
