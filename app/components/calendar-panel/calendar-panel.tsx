"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from "date-fns";
import { supabase } from "../../../lib/supabase";
import type { Room, CalendarEvent } from "../../types/calendar";
import styles from "./calendar-panel.module.css";

type Props = {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  eventDates?: string[];
  onAddEvent: () => void;
  activeRoom: Room | null;
  rooms: Room[];
};

export function CalendarPanel({ selectedDate, onSelectDate, onAddEvent, activeRoom, rooms }: Props) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate || new Date()));
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);

  // Fetch events for the current month
  const fetchMonthEvents = useCallback(async () => {
    if (rooms.length === 0) { setMonthEvents([]); return; }
    
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    
    let query = supabase.from("events").select("*").gte("event_date", start).lte("event_date", end);
    if (activeRoom) query = query.eq("calendar_id", activeRoom.id);
    else query = query.in("calendar_id", rooms.map(r => r.id));
    
    const { data, error } = await query;
    if (error) console.error("Error fetching month events:", error);
    else setMonthEvents((data ?? []) as CalendarEvent[]);
  }, [currentMonth, activeRoom, rooms]);

  useEffect(() => {
    fetchMonthEvents();
  }, [fetchMonthEvents]);

  // Generate calendar grid (42 cells: 6 weeks * 7 days)
  const gridCells = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });
    const startWeekday = getDay(start); // 0 = Sunday, 1 = Monday...
    
    type Cell = { type: "empty" | "day"; key: string; date?: Date };
    const cells: Cell[] = [];
    
    // Empty cells before the 1st
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ type: "empty", key: `prev-empty-${i}` });
    }
    
    // Actual days
    daysInMonth.forEach((day) => {
      cells.push({ type: "day", date: day, key: format(day, "yyyy-MM-dd") });
    });
    
    // Empty cells after the end to complete 42 cells (6 rows)
    const remaining = 42 - cells.length;
    for (let i = 0; i < remaining; i++) {
      cells.push({ type: "empty", key: `next-empty-${i}` });
    }
    
    return cells;
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getTabClass = (type: string) => {
    const t = type.toLowerCase();
    if (t === "exam") return styles.tabExam;
    if (t === "quiz") return styles.tabQuiz;
    if (t === "study") return styles.tabStudy;
    return styles.tabGeneral;
  };

  const getSmallDotClass = (type: string) => {
    const t = type.toLowerCase();
    if (t === "exam") return styles.smallDotExam;
    if (t === "quiz") return styles.smallDotQuiz;
    if (t === "study") return styles.smallDotStudy;
    return styles.smallDotGeneral;
  };

  return (
    <div className={styles.calendarSection}>
      <div className={styles.panelHead}>
        <h2>{format(currentMonth, "MMMM yyyy")}</h2>
        <div className={styles.nav}>
          <button onClick={handlePrevMonth} aria-label="Previous month">‹</button>
          <span>Month</span>
          <button onClick={handleNextMonth} aria-label="Next month">›</button>
          <span style={{ width: "12px" }}></span>
          <button className={styles.addBtn} onClick={onAddEvent}>+ Add event</button>
        </div>
      </div>

      <div className={styles.weekdays}>
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      <div className={styles.grid} key={currentMonth.toString()}>
        {gridCells.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.key} className={`${styles.cell} ${styles.empty}`}></div>;
          }

          const dateStr = format(cell.date!, "yyyy-MM-dd");
          const dayEvents = monthEvents.filter(e => e.event_date === dateStr);
          const isSelected = selectedDate && isSameDay(cell.date!, selectedDate);
          const isTodayDate = isToday(cell.date!);
          
          return (
            <div 
              key={cell.key} 
              className={`${styles.cell} ${isSelected ? styles.selected : ''} ${isTodayDate ? styles.today : ''}`}
              onClick={() => onSelectDate(cell.date!)}
            >
              {isTodayDate && <div className={styles.fold}></div>}
              <span className={styles.date}>{format(cell.date!, "d")}</span>
              
              <div className={styles.tabs}>
                {dayEvents.length > 0 && (
                  <div className={`${styles.tab} ${getTabClass(dayEvents[0].event_type)}`} title={dayEvents[0].title}>
                    {dayEvents[0].event_type}
                  </div>
                )}
                {dayEvents.length > 1 && (
                  <div className={styles.additionalDots}>
                    {dayEvents.slice(1).map(ev => (
                      <div 
                        key={ev.id} 
                        className={`${styles.smallDot} ${getSmallDotClass(ev.event_type)}`} 
                        title={ev.title}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span><span className={`${styles.dot} ${styles.dotExam}`}></span>Exam</span>
        <span><span className={`${styles.dot} ${styles.dotQuiz}`}></span>Quiz</span>
        <span><span className={`${styles.dot} ${styles.dotStudy}`}></span>Study session</span>
      </div>
    </div>
  );
}
