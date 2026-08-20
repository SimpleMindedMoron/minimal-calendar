"use client";

import { useEffect, useState } from "react";
import { CalendarDays, LogOut, Moon, Plus, Settings2, Sun } from "lucide-react";
import styles from "./icon-sidebar.module.css";

type Props = {
  onAddEvent: () => void;
  onManageRooms: () => void;
  onSignOut: () => void;
};

export function IconSidebar({ onAddEvent, onManageRooms, onSignOut }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <aside className={styles.sidebar} aria-label="Navigation">
      {/* Logo mark */}
      <div className={styles.logo} title="Agendly">
        <span className={styles.logoMark}>◈</span>
      </div>

      {/* Primary nav */}
      <nav className={styles.nav} aria-label="Main">
        <button
          id="nav-calendar"
          className={`${styles.btn} ${styles.btnActive}`}
          title="Calendar"
          aria-label="Calendar"
        >
          <CalendarDays size={19} />
        </button>

        <button
          id="nav-add-event"
          className={`${styles.btn} ${styles.btnAccent}`}
          title="Add event"
          aria-label="Add event"
          onClick={onAddEvent}
        >
          <Plus size={19} />
        </button>

        <button
          id="nav-manage-rooms"
          className={styles.btn}
          title="Manage rooms"
          aria-label="Manage rooms"
          onClick={onManageRooms}
        >
          <Settings2 size={19} />
        </button>
      </nav>

      {/* Bottom utility actions */}
      <div className={styles.bottom}>
        <button
          id="nav-theme"
          className={styles.btn}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          id="nav-signout"
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}
