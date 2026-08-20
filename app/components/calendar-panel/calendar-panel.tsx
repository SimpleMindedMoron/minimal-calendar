import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import styles from "./calendar-panel.module.css";

type Props = {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  eventDates?: string[]; // yyyy-MM-dd strings that have at least one event
};

export function CalendarPanel({ selectedDate, onSelectDate, eventDates = [] }: Props) {
  const eventDateSet = new Set(eventDates);

  return (
    <section className={styles.calendarSection} aria-label="Calendar">
      <div className={styles.panel}>
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          showOutsideDays
          classNames={{
            months: styles.months,
            month: styles.month,
            month_caption: styles.caption,
            caption_label: styles.captionLabel,
            nav: styles.nav,
            button_previous: styles.previousButton,
            button_next: styles.nextButton,
            month_grid: styles.table,
            weekdays: styles.headRow,
            weekday: styles.headCell,
            week: styles.row,
            day: styles.cell,
            day_button: styles.day,
            selected: styles.selected,
            today: styles.today,
            outside: styles.outside,
            disabled: styles.disabled,
            hidden: styles.hidden,
          }}
          components={{
            PreviousMonthButton: (props) => (
              <button {...props}>
                <ChevronLeft size={12} />
              </button>
            ),
            NextMonthButton: (props) => (
              <button {...props}>
                <ChevronRight size={12} />
              </button>
            ),
            DayButton: ({ day, modifiers, ...props }) => {
              const dateStr = format(day.date, "yyyy-MM-dd");
              const hasEvent = eventDateSet.has(dateStr);
              return (
                <button {...props}>
                  {day.date.getDate()}
                  {hasEvent && (
                    <span className={styles.eventDot} aria-hidden="true" />
                  )}
                </button>
              );
            },
          }}
        />
      </div>
    </section>
  );
}
