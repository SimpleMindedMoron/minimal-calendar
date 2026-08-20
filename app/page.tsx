"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { IconSidebar } from "./components/icon-sidebar/icon-sidebar";
import { LeftPanel } from "./components/left-panel/left-panel";
import { EventDialog } from "./components/event-dialog/event-dialog";
import { RoomDialog } from "./components/room-dialog/room-dialog";
import { EventList } from "./components/event-list/event-list";
import styles from "./page.module.css";
import { supabase } from "../lib/supabase";
import type { CalendarEvent, EventType, Room } from "./types/calendar";

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  // Room state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Upcoming & dot data
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [allEventDates, setAllEventDates] = useState<string[]>([]);

  // Fetch user + rooms
  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchRooms(user.id);
      }
    })();
  }, []);

  const fetchRooms = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("calendar_members")
      .select(`role, calendars(id, name)`)
      .eq("user_id", currentUserId);

    if (error) { console.error("Error fetching rooms:", error); return; }

    if (data) {
      type SupabaseRoomResponse = {
        role: "admin" | "contributor" | "viewer";
        calendars: { id: string; name: string };
      };
      const formattedRooms: Room[] = (data as unknown as SupabaseRoomResponse[]).map((item) => ({
        id: item.calendars.id,
        name: item.calendars.name,
        role: item.role,
      }));
      setRooms(formattedRooms);
    }
  };

  // Fetch events for selected date
  const fetchEvents = useCallback(async () => {
    if (!selectedDate || rooms.length === 0) { setEvents([]); return; }
    setLoading(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    let query = supabase.from("events").select("*").eq("event_date", formattedDate);
    if (activeRoom) query = query.eq("calendar_id", activeRoom.id);
    else query = query.in("calendar_id", rooms.map((r) => r.id));
    const { data, error } = await query.order("event_time", { ascending: true });
    if (error) console.error("Error fetching events:", error);
    else setEvents((data ?? []) as CalendarEvent[]);
    setLoading(false);
  }, [selectedDate, activeRoom, rooms]);

  // Fetch upcoming 7 days
  const fetchUpcomingEvents = useCallback(async () => {
    if (rooms.length === 0) { setUpcomingEvents([]); setAllEventDates([]); return; }
    const today = startOfDay(new Date());
    const fromDate = format(today, "yyyy-MM-dd");
    const toDate   = format(addDays(today, 8), "yyyy-MM-dd");
    let query = supabase.from("events").select("*").gte("event_date", fromDate).lt("event_date", toDate);
    if (activeRoom) query = query.eq("calendar_id", activeRoom.id);
    else query = query.in("calendar_id", rooms.map((r) => r.id));
    const { data, error } = await query.order("event_date").order("event_time");
    if (error) { console.error("Error fetching upcoming:", error); return; }
    const all = (data ?? []) as CalendarEvent[];
    setUpcomingEvents(all);
    setAllEventDates([...new Set(all.map((e) => e.event_date))]);
  }, [activeRoom, rooms]);

  useEffect(() => {
    if (userId) { void fetchEvents(); void fetchUpcomingEvents(); }
  }, [fetchEvents, fetchUpcomingEvents, userId]);

  const handleAddEvent = async (title: string, time: string, type: EventType) => {
    if (!selectedDate || !userId) return false;
    const targetRoomId = activeRoom ? activeRoom.id : rooms[0]?.id || null;
    if (!targetRoomId) { alert("You must join or create a room first."); return false; }
    const { error } = await supabase.from("events").insert([{
      calendar_id: targetRoomId,
      title,
      event_date: format(selectedDate, "yyyy-MM-dd"),
      event_time: `${time}:00`,
      event_type: type,
    }]);
    if (error) { console.error("Error adding event:", error); alert("Failed to add event"); return false; }
    await Promise.all([fetchEvents(), fetchUpcomingEvents()]);
    return true;
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { console.error("Error deleting event:", error); alert("Failed to delete event"); }
    else await Promise.all([fetchEvents(), fetchUpcomingEvents()]);
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom || activeRoom.role !== "admin") return;
    if (!window.confirm(`Delete "${activeRoom.name}"? This will remove all its events.`)) return;
    const { error } = await supabase.from("calendars").delete().eq("id", activeRoom.id);
    if (error) { console.error("Error deleting room:", error); alert("Failed to delete room."); }
    else { setActiveRoom(null); if (userId) await fetchRooms(userId); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!userId) return null;

  return (
    <div className={styles.appShell}>
      {/* Slim icon sidebar */}
      <IconSidebar
        onAddEvent={() => setIsEventModalOpen(true)}
        onManageRooms={() => setIsRoomModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Left panel: calendar + rooms + upcoming */}
      <LeftPanel
        rooms={rooms}
        activeRoom={activeRoom}
        onSelectRoom={setActiveRoom}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        eventDates={allEventDates}
        upcomingEvents={upcomingEvents}
        onDeleteRoom={handleDeleteRoom}
      />

      {/* Main content: events for selected day */}
      <main className={styles.main}>
        <EventList
          selectedDate={selectedDate}
          events={events}
          isLoading={loading}
          onDeleteEvent={handleDeleteEvent}
          onAddEvent={() => setIsEventModalOpen(true)}
          activeRoomName={activeRoom?.name}
        />
      </main>

      {/* Dialogs */}
      <EventDialog
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleAddEvent}
      />
      <RoomDialog
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => fetchRooms(userId)}
        userId={userId}
      />
    </div>
  );
}
