import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./calendar-panel.module.css";

type Props = { selectedDate: Date | undefined; onSelectDate: (date: Date | undefined) => void };
export function CalendarPanel({ selectedDate, onSelectDate }: Props) {
  return <section><div className={styles.panel}><DayPicker mode="single" selected={selectedDate} onSelect={onSelectDate} showOutsideDays classNames={{ months: styles.months, month: styles.month, month_caption: styles.caption, caption_label: styles.captionLabel, nav: styles.nav, button_previous: styles.previousButton, button_next: styles.nextButton, month_grid: styles.table, weekdays: styles.headRow, weekday: styles.headCell, week: styles.row, day: styles.cell, day_button: styles.day, selected: styles.selected, today: styles.today, outside: styles.outside, disabled: styles.disabled, hidden: styles.hidden }} components={{ PreviousMonthButton: (props) => <button {...props}><ChevronLeft size={16} /></button>, NextMonthButton: (props) => <button {...props}><ChevronRight size={16} /></button> }} /></div></section>;
}
