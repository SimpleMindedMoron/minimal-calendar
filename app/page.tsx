"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "./components/dashboard-header/dashboard-header";
import { EventDialog } from "./components/event-dialog/event-dialog";
import { EventList } from "./components/event-list/event-list";
import { CalendarPanel } from "./components/calendar-panel/calendar-panel";
import styles from "./page.module.css";
import { supabase } from "../lib/supabase";
import type { CalendarEvent, EventType } from "./types/calendar";

export default function Home() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*").eq("event_date", format(selectedDate, "yyyy-MM-dd"));
    if (error) console.error("Error fetching events:", error);
    else setEvents((data ?? []) as CalendarEvent[]);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { void (async () => { const { data: { session } } = await supabase.auth.getSession(); if (!session) router.push("/login"); else setIsAuthChecking(false); })(); }, [router]);
  // The selected date is external query input; this effect synchronizes its results with local UI state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!isAuthChecking) void fetchEvents(); }, [fetchEvents, isAuthChecking]);

  const handleAddEvent = async (title: string, time: string, type: EventType) => {
    if (!selectedDate) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("events").insert([{ calendar_id: "11111111-1111-1111-1111-111111111111", title, event_date: format(selectedDate, "yyyy-MM-dd"), event_time: `${time}:00`, event_type: type, created_by: user.id }]);
    if (error) { console.error("Error adding event:", error); alert("Failed to add event"); return false; }
    await fetchEvents();
    return true;
  };
  const handleDeleteEvent = async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) { console.error("Error deleting event:", error); alert("Failed to delete event"); } else await fetchEvents(); };
  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (isAuthChecking) return <div className={styles.loadingScreen} />;
  return <main className={styles.dashboard}>
    <DashboardHeader onAddEvent={() => setIsModalOpen(true)} onSignOut={handleSignOut} />
    <div className={styles.contentGrid}><CalendarPanel selectedDate={selectedDate} onSelectDate={setSelectedDate} /><EventList selectedDate={selectedDate} events={events} isLoading={loading} onDeleteEvent={handleDeleteEvent} /></div>
    <EventDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddEvent} />
  </main>;
}
