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

  // Fetch the user (guaranteed to exist by Middleware) and their rooms
  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  // Refetch events whenever the date, active room, or room list changes
  useEffect(() => {
    if (userId) void fetchEvents();
  }, [fetchEvents, userId]);

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
      setActiveRoom(null);
      if (userId) await fetchRooms(userId);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // We only render the UI once we have verified the user on the client
  // (Middleware handles the actual hard redirect, this just prevents rendering errors)
  if (!userId) return null;

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
        onSuccess={() => fetchRooms(userId)}
        userId={userId}
      />
    </main>
  );
}
