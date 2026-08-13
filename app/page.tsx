"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // This runs every time the selectedDate changes
  useEffect(() => {
    async function fetchEvents() {
      if (!selectedDate) return;
      setLoading(true);
      
      // Format the clicked date to YYYY-MM-DD so Supabase understands it
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      // Fetch events from Supabase that match the clicked date
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("event_date", formattedDate);
        
      if (error) console.error("Error fetching events:", error);
      else setEvents(data || []);
      
      setLoading(false);
    }

    fetchEvents();
  }, [selectedDate]);

  return (
    <main className="max-w-6xl mx-auto p-8 md:p-16">
      <header className="flex justify-between items-end mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400">CS101 Cohort & Study Group</p>
        </div>
        <button className="text-sm px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors">
          + Add Event
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12">
        <section>
          <div className="bg-[#1A1B26] p-6 rounded-2xl border border-gray-800/50">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              showOutsideDays
              className="font-sans"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-between pt-1 relative items-center mb-6",
                caption_label: "text-sm font-medium text-white",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full mb-4",
                head_cell: "text-gray-500 rounded-md w-10 font-medium text-[11px] uppercase tracking-widest text-center",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-10 w-10 p-0 font-normal rounded-full text-gray-300 hover:bg-gray-800 transition-colors aria-selected:opacity-100",
                day_selected: "bg-white text-black hover:bg-gray-200 hover:text-black font-semibold",
                day_today: "border border-gray-600 text-white",
                day_outside: "text-gray-700 opacity-50",
                day_disabled: "text-gray-700 opacity-50",
                day_hidden: "invisible",
              }}
              components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4 text-white" />,
                IconRight: () => <ChevronRight className="h-4 w-4 text-white" />,
              }}
            />
          </div>
        </section>

        <section className="space-y-8 mt-2 lg:mt-0">
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">
              {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}
            </h2>
            
            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-gray-500">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-gray-500">No events scheduled for this day.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-center group p-4 rounded-xl bg-transparent hover:bg-[#1A1B26] border border-transparent hover:border-gray-800/50 transition-all cursor-pointer">
                    {/* Conditionally color the dot based on event_type */}
                    <div className={`w-2.5 h-2.5 rounded-full mr-6 ${
                      event.event_type === 'exam' 
                        ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]' 
                        : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'
                    }`}></div>
                    
                    <div className="flex-1">
                      <h3 className="text-base text-gray-100 font-medium">{event.title}</h3>
                      {/* Formatting the time to remove seconds if present */}
                      <p className="text-sm text-gray-500 mt-0.5 capitalize">{event.event_type}</p>
                    </div>
                    
                    <div className="text-sm text-gray-400 font-mono bg-gray-900/50 px-3 py-1 rounded-md">
                      {event.event_time.slice(0, 5)}
                    </div>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </section>
      </div>
    </main>
  );
}