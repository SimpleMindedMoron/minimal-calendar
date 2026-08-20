"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "./components/dashboard-header/dashboard-header";
import { EventDialog } from "./components/event-dialog/event-dialog";
import { RoomDialog } from "./components/room-dialog/room-dialog";
import { EventList } from "./components/event-list/event-list";
import { CalendarPanel } from "./components/calendar-panel/calendar-panel";
import styles from "./page.module.css";
import { supabase } from "../lib/supabase";
import type { CalendarEvent, EventType, Room } from "./types/calendar";

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Room State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUserId(session.user.id);
        await fetchRooms(session.user.id);
        setIsAuthChecking(false);
      }
    })();
  }, [router]);

  const fetchRooms = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("calendar_members")
      .select(`role, calendars(id, name)`)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Error fetching rooms:", error);
      return;
    }

    if (data) {
      type SupabaseRoomResponse = {
        role: "admin" | "contributor" | "viewer";
        calendars: { id: string; name: string };
      };
      const formattedRooms: Room[] = (
        data as unknown as SupabaseRoomResponse[]
      ).map((item) => ({
        id: item.calendars.id,
        name: item.calendars.name,
        role: item.role,
      }));
      setRooms(formattedRooms);
    }
  };

  const fetchEvents = useCallback(async () => {
    if (!selectedDate || rooms.length === 0) {
      setEvents([]);
      return;
    }

    setLoading(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    let query = supabase
      .from("events")
      .select("*")
      .eq("event_date", formattedDate);

    if (activeRoom) {
      query = query.eq("calendar_id", activeRoom.id);
    } else {
      const roomIds = rooms.map((r) => r.id);
      query = query.in("calendar_id", roomIds);
    }

    const { data, error } = await query.order("event_time", {
      ascending: true,
    });

    if (error) console.error("Error fetching events:", error);
    else setEvents((data ?? []) as CalendarEvent[]);

    setLoading(false);
  }, [selectedDate, activeRoom, rooms]);

  useEffect(() => {
    if (!isAuthChecking) void fetchEvents();
  }, [fetchEvents, isAuthChecking]);

  const handleAddEvent = async (
    title: string,
    time: string,
    type: EventType,
  ) => {
    if (!selectedDate || !userId) return false;

    const targetRoomId = activeRoom ? activeRoom.id : rooms[0]?.id || null;

    if (!targetRoomId) {
      alert("You must join or create a room first.");
      return false;
    }

    const { error } = await supabase.from("events").insert([
      {
        calendar_id: targetRoomId,
        title,
        event_date: format(selectedDate, "yyyy-MM-dd"),
        event_time: `${time}:00`,
        event_type: type,
      },
    ]);

    if (error) {
      console.error("Error adding event:", error);
      alert("Failed to add event");
      return false;
    }

    await fetchEvents();
    return true;
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    } else {
      await fetchEvents();
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom || activeRoom.role !== "admin") return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${activeRoom.name}"? This action cannot be undone and will delete all associated events.`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("calendars")
      .delete()
      .eq("id", activeRoom.id);

    if (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room.");
    } else {
      setActiveRoom(null); // Reset to "All Rooms" view
      if (userId) await fetchRooms(userId); // Refresh the room list
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isAuthChecking)
    return <div className={styles.loadingScreen}>Loading...</div>;

  return (
    <main className={styles.dashboard}>
      <DashboardHeader
        rooms={rooms}
        activeRoom={activeRoom}
        onSelectRoom={setActiveRoom}
        onAddEvent={() => setIsEventModalOpen(true)}
        onManageRooms={() => setIsRoomModalOpen(true)}
        onDeleteRoom={handleDeleteRoom}
        onSignOut={handleSignOut}
      />
      <div className={styles.contentGrid}>
        <CalendarPanel
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <EventList
          selectedDate={selectedDate}
          events={events}
          isLoading={loading}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>

      <EventDialog
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleAddEvent}
      />

      <RoomDialog
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => fetchRooms(userId!)}
        userId={userId}
      />
    </main>
  );
}
