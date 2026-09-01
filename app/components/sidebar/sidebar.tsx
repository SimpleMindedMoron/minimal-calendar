"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  LogOut,
  Plus,
  Hash,
} from "lucide-react";
import type { Room } from "../../types/calendar";
import styles from "./sidebar.module.css";

type Props = {
  rooms: Room[];
  activeRoom: Room | null;
  onSelectRoom: (roomId: string) => void;
  onOpenManageRooms: () => void;
  onOpenManageAccount: () => void;
  onSignOut: () => void;
  userName?: string;
  userEmail?: string;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
};

export function Sidebar({
  rooms,
  activeRoom,
  onSelectRoom,
  onOpenManageRooms,
  onOpenManageAccount,
  onSignOut,
  userName,
  userEmail,
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
}: Props) {
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    text: string;
    top: number;
  } | null>(null);

  const personalRoom = rooms.find((r) => r.name === "Personal Calendar");
  const sharedRooms = rooms.filter((r) => r.name !== "Personal Calendar");
  const initial = userName ? userName.charAt(0).toUpperCase() : "U";

  const handleMouseEnter = (
    text: string,
    e: React.MouseEvent<HTMLElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      text,
      top: rect.top + rect.height / 2,
    });
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isExpanded ? styles.expanded : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}
        onClick={() => {
          setIsMobileOpen(false);
          setIsExpanded(false);
        }}
      />

      <aside
        className={`${styles.sidebar} ${
          isExpanded ? styles.expanded : styles.collapsed
        } ${isMobileOpen ? styles.mobileOpen : ""}`}
        aria-label="Application Sidebar"
      >
        {/* Header & Logo */}
        <div className={styles.sidebarHeader}>
          <Link
            href="/"
            className={styles.brandGroup}
            onMouseEnter={(e) => handleMouseEnter("Align Home", e)}
            onMouseLeave={handleMouseLeave}
            title="Align Home"
          >
            <div className={styles.logo}>A</div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Align</span>
              <span className={styles.brandSubtitle}>Shared Calendar</span>
            </div>
          </Link>

          {/* Toggle Arrow */}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => {
              setIsExpanded(!isExpanded);
              setHoveredTooltip(null);
            }}
            onMouseEnter={(e) =>
              handleMouseEnter(
                isExpanded ? "Collapse Sidebar" : "Expand Sidebar",
                e
              )
            }
            onMouseLeave={handleMouseLeave}
            aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation Body */}
        <div className={styles.sidebarBody}>
          {/* Spaces Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>My Spaces</div>

            {/* Personal Calendar */}
            {personalRoom && (
              <button
                type="button"
                className={`${styles.navItem} ${
                  activeRoom?.id === personalRoom.id ? styles.navItemActive : ""
                }`}
                onClick={() => onSelectRoom(personalRoom.id)}
                onMouseEnter={(e) => handleMouseEnter("Personal Calendar", e)}
                onMouseLeave={handleMouseLeave}
                title="Personal Calendar"
              >
                <div className={styles.itemIcon}>
                  <Calendar size={18} />
                </div>
                <span className={styles.itemLabel}>Personal Calendar</span>
              </button>
            )}

            {/* Shared Rooms */}
            {sharedRooms.map((room) => {
              const isActive = activeRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  className={`${styles.navItem} ${
                    isActive ? styles.navItemActive : ""
                  }`}
                  onClick={() => onSelectRoom(room.id)}
                  onMouseEnter={(e) => handleMouseEnter(room.name, e)}
                  onMouseLeave={handleMouseLeave}
                  title={room.name}
                >
                  <div className={styles.itemIcon}>
                    <Hash size={18} />
                  </div>
                  <span className={styles.itemLabel}>{room.name}</span>
                </button>
              );
            })}

            {/* Add / Join Space */}
            <button
              type="button"
              className={styles.navItem}
              onClick={onOpenManageRooms}
              onMouseEnter={(e) => handleMouseEnter("Create or Join Space", e)}
              onMouseLeave={handleMouseLeave}
              title="Create or Join Space"
            >
              <div className={styles.itemIcon}>
                <Plus size={18} />
              </div>
              <span className={styles.itemLabel}>Create or Join Space</span>
            </button>
          </div>
        </div>

        {/* Footer Section */}
        <div className={styles.sidebarFooter}>
          {/* Manage Account (Dedicated) */}
          <button
            type="button"
            className={styles.navItem}
            onClick={onOpenManageAccount}
            onMouseEnter={(e) => handleMouseEnter("Manage Account", e)}
            onMouseLeave={handleMouseLeave}
            title="Manage Account"
          >
            <div className={styles.itemIcon}>
              <User size={18} />
            </div>
            <span className={styles.itemLabel}>Manage Account</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            className={`${styles.navItem} ${styles.dangerNavItem}`}
            onClick={onSignOut}
            onMouseEnter={(e) => handleMouseEnter("Sign Out", e)}
            onMouseLeave={handleMouseLeave}
            title="Sign Out"
          >
            <div className={styles.itemIcon}>
              <LogOut size={18} />
            </div>
            <span className={styles.itemLabel}>Sign Out</span>
          </button>

          {/* User Card */}
          {(userName || userEmail) && (
            <div
              className={styles.userCard}
              onClick={onOpenManageAccount}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) =>
                handleMouseEnter(`Account: ${userName || userEmail}`, e)
              }
              onMouseLeave={handleMouseLeave}
              title={`Account: ${userName || userEmail}`}
            >
              <div className={styles.userAvatar}>{initial}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName || "User"}</span>
                <span className={styles.userEmail}>{userEmail || ""}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Unclipped Global Floating Tooltip */}
      {hoveredTooltip && (
        <div
          className={`${styles.floatingTooltip} ${
            isExpanded ? styles.expandedFloatingTooltip : ""
          }`}
          style={{ top: `${hoveredTooltip.top}px` }}
        >
          {hoveredTooltip.text}
        </div>
      )}
    </>
  );
}
