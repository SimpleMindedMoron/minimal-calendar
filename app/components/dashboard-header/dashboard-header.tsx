import { LogOut } from "lucide-react";
import styles from "./dashboard-header.module.css";

type Props = { onAddEvent: () => void; onSignOut: () => void };
export function DashboardHeader({ onAddEvent, onSignOut }: Props) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>CS101 Cohort &amp; Study Group</p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onAddEvent} className={styles.addButton}>
          + Add Event
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className={styles.signOutButton}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
