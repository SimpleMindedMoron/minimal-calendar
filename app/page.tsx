"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Settings, ChevronDown } from "lucide-react";
import { CalendarPanel } from "./components/calendar-panel/calendar-panel";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Upcoming & dot data
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [allEventDates, setAllEventDates] = useState<string[]>([]);
  const [upcomingThisWeek, setUpcomingThisWeek] = useState(0);

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
      
      // If no active room is set but rooms exist, pick the first one by default
      if (formattedRooms.length > 0 && !activeRoom) {
        setActiveRoom(formattedRooms[0]);
      }
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
    
    // Calculate events due this week (next 7 days)
    setUpcomingThisWeek(all.length);
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

  const handleRoomSelect = (roomId: string | null) => {
    if (roomId === null) setActiveRoom(null);
    else {
      const room = rooms.find(r => r.id === roomId);
      if (room) setActiveRoom(room);
    }
    setIsDropdownOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (isDropdownOpen) setIsDropdownOpen(false);
    };
    if (isDropdownOpen) document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [isDropdownOpen]);

  if (!userId) return null;

  return (
    <div className={styles.appShell}>
      <div className={styles.page}>
        <div className={styles.letterhead}>
          <div className={styles.mark}>
            <div className={styles.markGlyph}>Lg</div>
            <div>
              <div 
                className={styles.roomSelectWrapper} 
                onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
              >
                <h1>{activeRoom ? activeRoom.name : "All Rooms"}</h1>
                <ChevronDown 
                  size={20} 
                  className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.dropdownIconOpen : ""}`} 
                />
                
                {isDropdownOpen && (
                  <div className={styles.roomDropdown}>
                    <button 
                      className={`${styles.roomOption} ${activeRoom === null ? styles.roomOptionActive : ""}`} 
                      onClick={() => handleRoomSelect(null)}
                    >
                      All Rooms
                    </button>
                    {rooms.map(r => (
                      <button 
                        key={r.id} 
                        className={`${styles.roomOption} ${activeRoom?.id === r.id ? styles.roomOptionActive : ""}`} 
                        onClick={() => handleRoomSelect(r.id)}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.sub}>
                <span>Shared calendar · {rooms.length} accessible rooms</span>
                <button className={styles.headerBtn} onClick={() => setIsRoomModalOpen(true)}>
                  <Settings size={12} /> Manage
                </button>
                <button className={`${styles.headerBtn} ${styles.dangerBtn}`} onClick={handleSignOut}>
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            </div>
          </div>
          <div className={styles.tally}>
            <div className={styles.num}>{upcomingThisWeek}</div>
            <div className={styles.label}>Events this week</div>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Left panel: calendar */}
          <div className={styles.panel}>
            <CalendarPanel
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              eventDates={allEventDates}
              onAddEvent={() => setIsEventModalOpen(true)}
              activeRoom={activeRoom}
              rooms={rooms}
            />
          </div>

          {/* Right sidebar: Agenda + Stamp */}
          <div className={styles.sidebar}>
            <div className={styles.panel}>
              <EventList
                selectedDate={selectedDate}
                events={events}
                isLoading={loading}
                onDeleteEvent={handleDeleteEvent}
                onAddEvent={() => setIsEventModalOpen(true)}
                activeRoomName={activeRoom?.name}
              />
            </div>
            
            <div className={`${styles.panel} ${styles.stampPanel}`}>
              <div className={styles.stamp}>
                <div className={styles.n}>{upcomingThisWeek}</div>
                <div className={styles.l}>Due<br/>this week</div>
              </div>
              <p>
                {upcomingThisWeek > 0 
                  ? `You have ${upcomingThisWeek} upcoming event${upcomingThisWeek === 1 ? '' : 's'} scheduled for the next 7 days.` 
                  : "No events coming up this week. Enjoy your free time!"}
              </p>
            </div>
          </div>
        </div>
      </div>

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
