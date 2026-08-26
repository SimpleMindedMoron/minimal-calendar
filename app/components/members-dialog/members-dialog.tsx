"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, User, ShieldAlert } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { Room } from "../../types/calendar";
import styles from "./members-dialog.module.css";

type MemberInfo = {
  id: string;
  user_id: string;
  role: "admin" | "contributor" | "viewer" | string;
  joined_at?: string;
  full_name?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeRoom: Room | null;
  rooms: Room[];
  onOpenInvite: () => void;
  onLeaveRoom?: (roomId: string) => Promise<void>;
};

export function MembersDialog({
  isOpen,
  onClose,
  activeRoom,
  rooms,
  onOpenInvite,
  onLeaveRoom,
}: Props) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeRoom) {
      setSelectedRoomId(activeRoom.id);
    } else if (rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [activeRoom, rooms, isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedRoomId) return;

    let isMounted = true;
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("calendar_members")
        .select("id, user_id, role, joined_at")
        .eq("calendar_id", selectedRoomId);

      if (isMounted) {
        if (!error && data && data.length > 0) {
          const membersData = data as MemberInfo[];
          
          // Fetch profiles
          const userIds = membersData.map((m) => m.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from("user_profiles")
            .select("id, full_name")
            .in("id", userIds);

          if (!profilesError && profiles) {
            membersData.forEach((m) => {
              const profile = profiles.find((p) => p.id === m.user_id);
              if (profile && profile.full_name) {
                m.full_name = profile.full_name;
              }
            });
          }
          
          setMembers(membersData);
        } else {
          setMembers([]);
        }
        setLoading(false);
      }
    };

    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedRoomId]);

  if (!isOpen) return null;

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || activeRoom || rooms[0];

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return <ShieldAlert size={12} className={styles.roleAdminIcon} />;
      case "contributor":
        return <Shield size={12} className={styles.roleContributorIcon} />;
      default:
        return <User size={12} className={styles.roleViewerIcon} />;
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="members-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.badge}>
            <Users size={13} />
            <span>Room Roster</span>
          </div>
          <h2 id="members-dialog-title" className={styles.title}>
            Members
          </h2>
          <p className={styles.subtitle}>
            People who have access to this shared calendar space.
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You have not joined any rooms yet.</p>
            <button className={styles.doneButton} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div className={styles.body}>
            {/* Room Selector if multiple rooms */}
            {rooms.length > 1 && (
              <div className={styles.roomSelectSection}>
                <label htmlFor="members-room-select" className={styles.label}>
                  Select Room
                </label>
                <select
                  id="members-room-select"
                  className={styles.select}
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                >
                  {rooms.filter(r => r.name !== "Personal Calendar").map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.role === "admin" ? "(Admin)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.rosterSection}>
              <div className={styles.rosterHeader}>
                <span className={styles.label}>
                  {loading
                    ? "Loading members..."
                    : `${members.length} Member${members.length === 1 ? "" : "s"}`}
                </span>
                {currentRoom && (
                  <span className={styles.roomTag}>{currentRoom.name}</span>
                )}
              </div>

              <div className={styles.memberList}>
                {loading ? (
                  <div className={styles.loadingRow}>Loading roster...</div>
                ) : members.length === 0 ? (
                  <div className={styles.emptyRow}>No members found.</div>
                ) : (
                  members.map((m, idx) => (
                    <div key={m.id || idx} className={styles.memberItem}>
                      <div className={styles.memberAvatar}>
                        {m.role === "admin" ? "★" : "●"}
                      </div>
                      <div className={styles.memberDetails}>
                        <span className={styles.memberId}>
                          {m.full_name ? m.full_name : `User #${m.user_id.slice(0, 8)}`}
                        </span>
                        {m.joined_at && (
                          <span className={styles.memberJoined}>
                            Joined {new Date(m.joined_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <span className={`${styles.roleBadge} ${styles[`role_${m.role}`] || ""}`}>
                        {getRoleIcon(m.role)}
                        <span>{m.role}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <div className={styles.leftActions}>
                {currentRoom?.name !== "Personal Calendar" && (
                  <button
                    type="button"
                    className={styles.inviteButton}
                    onClick={() => {
                      onClose();
                      onOpenInvite();
                    }}
                  >
                    <UserPlus size={14} />
                    <span>Invite</span>
                  </button>
                )}

                {onLeaveRoom && currentRoom && currentRoom.name !== "Personal Calendar" && (
                  <button
                    type="button"
                    className={styles.leaveButton}
                    onClick={async () => {
                      onClose();
                      await onLeaveRoom(currentRoom.id);
                    }}
                  >
                    <span>Leave Room</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                className={styles.doneButton}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
