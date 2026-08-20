import { LogOut } from "lucide-react";
import type { Room } from "../../types/calendar";
import styles from "./dashboard-header.module.css";

type Props = {
  rooms: Room[];
  activeRoom: Room | null;
  onSelectRoom: (room: Room | null) => void;
  onAddEvent: () => void;
  onManageRooms: () => void;
  onDeleteRoom: () => void;
  onSignOut: () => void;
};

export function DashboardHeader({
  rooms,
  activeRoom,
  onSelectRoom,
  onAddEvent,
  onManageRooms,
  onDeleteRoom,
  onSignOut,
}: Props) {
  const handleCopyCode = () => {
    if (activeRoom) {
      navigator.clipboard.writeText(activeRoom.id);
      alert("Invite code copied to clipboard!");
    }
  };

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.roomControls}>
          <select
            className={styles.roomSelector}
            value={activeRoom?.id || "all"}
            onChange={(e) => {
              if (e.target.value === "all") onSelectRoom(null);
              else {
                const selected = rooms.find((r) => r.id === e.target.value);
                if (selected) onSelectRoom(selected);
              }
            }}
          >
            <option value="all">All Rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <button onClick={onManageRooms} className={styles.textButton}>
            Manage Rooms
          </button>

          {activeRoom && (
            <button onClick={handleCopyCode} className={styles.textButton}>
              Copy Invite Code
            </button>
          )}

          {/* Only render Delete button if the user is an admin of the active room */}
          {activeRoom?.role === "admin" && (
            <button
              onClick={onDeleteRoom}
              className={`${styles.textButton} ${styles.deleteTextButton}`}
            >
              Delete Room
            </button>
          )}
        </div>
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
