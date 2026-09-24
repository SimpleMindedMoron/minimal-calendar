"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Plus, Settings, ChevronDown, UserPlus, Users, Menu } from "lucide-react";
import { CalendarPanel } from "./components/calendar-panel/calendar-panel";
import { EventDialog } from "./components/event-dialog/event-dialog";
import { RoomDialog } from "./components/room-dialog/room-dialog";
import { InviteDialog } from "./components/invite-dialog/invite-dialog";
import { MembersDialog } from "./components/members-dialog/members-dialog";
import { EventList } from "./components/event-list/event-list";
import { EventDetailsDialog } from "./components/event-details-dialog/event-details-dialog";
import { Onboarding } from "./components/onboarding/onboarding";
import { DeleteAccountDialog } from "./components/delete-account-dialog/delete-account-dialog";
import { AccountDialog } from "./components/account-dialog/account-dialog";
import { SignOutDialog } from "./components/sign-out-dialog/sign-out-dialog";
import { Sidebar } from "./components/sidebar/sidebar";
import styles from "./page.module.css";
import { supabase } from "../lib/supabase";
import type { CalendarEvent, EventType, Room } from "./types/calendar";
import { useNotifications } from "./hooks/useNotifications";

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Room & Account modal state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [allEventDates, setAllEventDates] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allFutureEvents, setAllFutureEvents] = useState<CalendarEvent[]>([]);

  // Notifications
  const { isSupported: isNotifSupported, isSubscribed, isLoading: isNotifLoading, subscribe, unsubscribe } = useNotifications(allFutureEvents);

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  // Fetch user + rooms
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarExpanded(false);
      }
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        setUserName(user.user_metadata?.full_name || "");
        if (!user.user_metadata?.full_name) {
          setNeedsOnboarding(true);
        } else {
          await fetchRooms(user.id);
        }
      }
    })();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOnboardingComplete = async () => {
    setNeedsOnboarding(false);
    if (userId) {
      await fetchRooms(userId);
    }
  };

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
      let formattedRooms: Room[] = (data as unknown as SupabaseRoomResponse[]).map((item) => ({
        id: item.calendars.id,
        name: item.calendars.name,
        role: item.role,
      }));

      // Deduplicate Personal Calendars caused by dev-mode race conditions
      const personalCals = formattedRooms.filter(r => r.name === "Personal Calendar");
      if (personalCals.length > 1) {
        const [first, ...rest] = personalCals;
        const restIds = new Set(rest.map(r => r.id));
        formattedRooms = formattedRooms.filter(r => !restIds.has(r.id));
      }

      // Auto-create Personal Calendar if it doesn't exist
      const hasPersonal = formattedRooms.some((r) => r.name === "Personal Calendar");
      if (!hasPersonal) {
        const { data: newRoom, error: roomError } = await supabase
          .from("calendars")
          .insert([{ name: "Personal Calendar" }])
          .select()
          .single();

        if (!roomError && newRoom) {
          const { error: memberError } = await supabase
            .from("calendar_members")
            .insert([{ calendar_id: newRoom.id, user_id: currentUserId, role: "admin" }]);

          if (!memberError) {
            formattedRooms.unshift({ id: newRoom.id, name: newRoom.name, role: "admin" });
          }
        }
      }

      setRooms(formattedRooms);

      // Select Personal Calendar by default if no active room is set
      if (formattedRooms.length > 0 && !activeRoom) {
        const personal = formattedRooms.find(r => r.name === "Personal Calendar");
        setActiveRoom(personal || formattedRooms[0]);
      }
    }
  };

  // Fetch events for selected date
  const fetchEvents = useCallback(async () => {
    if (!selectedDate || rooms.length === 0) { setEvents([]); return; }
    setLoading(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    let query = supabase.from("events").select("*").eq("event_date", formattedDate);
    if (activeRoom && activeRoom.name !== "Personal Calendar") {
      query = query.eq("calendar_id", activeRoom.id);
    } else {
      query = query.in("calendar_id", rooms.map((r) => r.id));
    }
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
    const toDate = format(addDays(today, 8), "yyyy-MM-dd");
    let query = supabase.from("events").select("*").gte("event_date", fromDate).lt("event_date", toDate);
    if (activeRoom && activeRoom.name !== "Personal Calendar") {
      query = query.eq("calendar_id", activeRoom.id);
    } else {
      query = query.in("calendar_id", rooms.map((r) => r.id));
    }
    const { data, error } = await query.order("event_date").order("event_time");
    if (error) { console.error("Error fetching upcoming:", error); return; }
    const all = (data ?? []) as CalendarEvent[];
    setUpcomingEvents(all);
    setAllEventDates([...new Set(all.map((e) => e.event_date))]);
  }, [activeRoom, rooms]);

  // Fetch all future events for notification scheduling (up to 60 days)
  const fetchAllFutureEvents = useCallback(async () => {
    if (rooms.length === 0) { setAllFutureEvents([]); return; }
    const today = startOfDay(new Date());
    const fromDate = format(today, "yyyy-MM-dd");
    const toDate = format(addDays(today, 60), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", fromDate)
      .lt("event_date", toDate)
      .in("calendar_id", rooms.map((r) => r.id))
      .order("event_date")
      .order("event_time");
    if (error) { console.error("Error fetching future events:", error); return; }
    setAllFutureEvents((data ?? []) as CalendarEvent[]);
  }, [rooms]);

  useEffect(() => {
    if (userId) { void fetchEvents(); void fetchUpcomingEvents(); void fetchAllFutureEvents(); }
  }, [fetchEvents, fetchUpcomingEvents, fetchAllFutureEvents, userId]);

  const handleAddEvent = async (title: string, time: string, type: EventType, date: string, roomId: string, description: string) => {
    if (!userId) return false;
    const { error } = await supabase.from("events").insert([{
      calendar_id: roomId,
      title,
      event_date: date,
      event_time: `${time}:00`,
      event_type: type,
      description,
      created_by: userId,
    }]);
    if (error) { console.error("Error adding event:", error); alert("Failed to add event"); return false; }
    await Promise.all([fetchEvents(), fetchUpcomingEvents(), fetchAllFutureEvents()]);
    setRefreshTrigger(prev => prev + 1);
    return true;
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { console.error("Error deleting event:", error); alert("Failed to delete event"); }
    else {
      await Promise.all([fetchEvents(), fetchUpcomingEvents(), fetchAllFutureEvents()]);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) setActiveRoom(room);
    setIsDropdownOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login?signed_out=true");
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!userId) return;
    const roomToLeave = rooms.find((r) => r.id === roomId);
    const roomName = roomToLeave ? roomToLeave.name : "this room";
    if (!confirm(`Are you sure you want to leave "${roomName}"?`)) return;

    const { error } = await supabase
      .from("calendar_members")
      .delete()
      .eq("calendar_id", roomId)
      .eq("user_id", userId);

    if (error) {
      alert("Failed to leave room: " + error.message);
    } else {
      if (activeRoom?.id === roomId) {
        setActiveRoom(null);
      }
      await fetchRooms(userId);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!userId) return;
    const roomToDelete = rooms.find((r) => r.id === roomId);
    const roomName = roomToDelete ? roomToDelete.name : "this room";
    if (!confirm(`Are you absolutely sure you want to DELETE "${roomName}"? This will permanently remove all events and kick all members.`)) return;

    const { error } = await supabase
      .from("calendars")
      .delete()
      .eq("id", roomId);

    if (error) {
      alert("Failed to delete room: " + error.message);
    } else {
      if (activeRoom?.id === roomId) {
        setActiveRoom(null);
      }
      await fetchRooms(userId);
    }
  };

  const handleDeleteAccount = async () => {
    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete account.");
    }

    await supabase.auth.signOut();
    router.push("/login?deleted=true");
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

  if (needsOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={styles.appShell}>
      {/* Mobile Hamburger */}
      <button 
        className={styles.mobileHamburger}
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        onSelectRoom={handleRoomSelect}
        onOpenManageRooms={() => setIsRoomModalOpen(true)}
        onOpenManageAccount={() => setIsAccountModalOpen(true)}
        onSignOut={() => setIsSignOutModalOpen(true)}
        userName={userName}
        userEmail={userEmail}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isSubscribed={isSubscribed}
        isNotifSupported={isNotifSupported}
        isNotifLoading={isNotifLoading}
        onToggleNotifications={handleToggleNotifications}
      />
      <div className={styles.page}>
        <div className={`${styles.letterhead} animate-in`} style={{ animationDelay: "100ms" }}>
          <div className={styles.mark}>
            <div className={styles.roomHeaderGroup}>
              <div
                className={styles.roomSelectWrapper}
                onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
              >
                <h1>{activeRoom ? activeRoom.name : "Loading..."}</h1>
                <ChevronDown
                  size={20}
                  className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.dropdownIconOpen : ""}`}
                />

                {isDropdownOpen && (
                  <div className={styles.roomDropdown}>
                    {rooms.find(r => r.name === "Personal Calendar") && (
                      <button
                        className={`${styles.roomOption} ${activeRoom?.name === "Personal Calendar" ? styles.roomOptionActive : ""}`}
                        onClick={() => handleRoomSelect(rooms.find(r => r.name === "Personal Calendar")!.id)}
                      >
                        Personal Calendar
                      </button>
                    )}

                    {rooms.filter(r => r.name !== "Personal Calendar").length > 0 && (
                      <div className={styles.roomDropdownSection}>Shared Rooms</div>
                    )}

                    {rooms.filter(r => r.name !== "Personal Calendar").map(r => (
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
              <div className={styles.membersWrapper}>
                {activeRoom?.name !== "Personal Calendar" && (
                  <button
                    type="button"
                    className={styles.membersBtn}
                    onClick={() => setIsMembersModalOpen(true)}
                    aria-label="View room members"
                  >
                    <Users size={12} />
                    <span>Members</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {activeRoom?.name !== "Personal Calendar" && (
              <button className={styles.inviteBtn} onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus size={14} /> Invite
              </button>
            )}
          </div>
        </div>

        <div className={styles.layout}>
          {/* Left panel: calendar */}
          <div className={`${styles.panel} animate-in`} style={{ animationDelay: "200ms" }}>
            <CalendarPanel
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              eventDates={allEventDates}
              onAddEvent={() => setIsEventModalOpen(true)}
              activeRoom={activeRoom}
              rooms={rooms}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Right sidebar: Agenda + Stamp */}
          <div className={`${styles.sidebar} animate-in`} style={{ animationDelay: "300ms" }}>
            <div className={styles.panel}>
              <EventList
                selectedDate={selectedDate}
                events={events}
                isLoading={loading}
                onDeleteEvent={handleDeleteEvent}
                onAddEvent={() => setIsEventModalOpen(true)}
                onEventClick={(ev) => setSelectedEvent(ev)}
                activeRoomName={activeRoom?.name}
              />
            </div>
            <div className={styles.upcomingPanel}>
              <h3 className={styles.upcomingTitle}>Later This Week</h3>
              <div className={styles.upcomingList}>
                {(() => {
                  const future = upcomingEvents.filter(e => e.event_date !== format(new Date(), "yyyy-MM-dd"));
                  if (future.length === 0) {
                    return <p className={styles.emptyUpcoming}>No upcoming events this week.</p>;
                  }

                  const visible = isUpcomingExpanded ? future : future.slice(0, 3);

                  return (
                    <>
                      {visible.map(ev => {
                        const [y, m, d] = ev.event_date.split("-").map(Number);
                        const localDate = new Date(y, m - 1, d);
                        return (
                          <div
                            key={ev.id}
                            className={styles.upcomingItem}
                            onClick={() => setSelectedEvent(ev)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className={styles.upcomingDate}>{format(localDate, "MMM d")}</div>
                            <div className={styles.upcomingDetails}>
                              <div className={styles.upcomingName}>{ev.title}</div>
                              <div className={styles.upcomingTime}>{ev.event_time.slice(0, 5)}</div>
                            </div>
                          </div>
                        );
                      })}
                      {future.length > 3 && (
                        <button
                          className={styles.viewMoreBtn}
                          onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                        >
                          {isUpcomingExpanded ? "View less" : (
                            <span className={styles.viewMoreContent}>
                              <span className={styles.dots}>
                                <span className={styles.dot}></span>
                                <span className={styles.dot}></span>
                                <span className={styles.dot}></span>
                              </span>
                              View {future.length - 3} more
                            </span>
                          )}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        Align &copy; {new Date().getFullYear()}
      </footer>

      {/* Dialogs */}
      <EventDialog
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleAddEvent}
        rooms={rooms}
        defaultRoomId={activeRoom?.id || ""}
        defaultDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
      />
      <RoomDialog
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={() => fetchRooms(userId)}
        userId={userId}
        rooms={rooms}
        onLeaveRoom={handleLeaveRoom}
        onDeleteRoom={handleDeleteRoom}
      />
      <AccountDialog
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        userEmail={userEmail}
        userName={userName}
        roomCount={rooms.length}
        onOpenDeleteAccount={() => setIsDeleteAccountModalOpen(true)}
      />
      <DeleteAccountDialog
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
        userEmail={userEmail}
      />
      <SignOutDialog
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirmSignOut={handleSignOut}
      />
      <InviteDialog
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        activeRoom={activeRoom}
        rooms={rooms}
      />
      <MembersDialog
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        activeRoom={activeRoom}
        rooms={rooms}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
      />
      <EventDetailsDialog
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        rooms={rooms}
        currentUserId={userId}
      />
    </div>
  );
}
