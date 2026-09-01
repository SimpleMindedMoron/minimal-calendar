"use client";

import { useState } from "react";
import { Trash2, KeyRound, ChevronRight } from "lucide-react";
import { ChangePasswordDialog } from "../change-password-dialog/change-password-dialog";
import styles from "./account-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  roomCount: number;
  onOpenDeleteAccount: () => void;
};

export function AccountDialog({
  isOpen,
  onClose,
  userEmail,
  userName,
  roomCount,
  onOpenDeleteAccount,
}: Props) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} role="presentation" onClick={onClose}>
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 id="account-dialog-title" className={styles.title}>
              Manage Account
            </h2>
            <p className={styles.subtitle}>
              Your personal profile, password security, and account settings.
            </p>
          </div>

          <div className={styles.accountContainer}>
            {/* Profile Card */}
            <div className={styles.accountCard}>
              {userName && (
                <div className={styles.accountField}>
                  <span className={styles.accountLabel}>Name</span>
                  <span className={styles.accountVal}>{userName}</span>
                </div>
              )}
              {userEmail && (
                <div className={styles.accountField}>
                  <span className={styles.accountLabel}>Email</span>
                  <span className={styles.accountVal}>{userEmail}</span>
                </div>
              )}
              <div className={styles.accountField}>
                <span className={styles.accountLabel}>Active Spaces</span>
                <span className={styles.accountVal}>{roomCount}</span>
              </div>
            </div>

            {/* Change Password Option (Opens Pop-up Modal) */}
            <button
              type="button"
              className={styles.optionCard}
              onClick={() => setIsChangePasswordOpen(true)}
            >
              <div className={styles.optionInfo}>
                <div className={styles.optionIcon}>
                  <KeyRound size={16} />
                </div>
                <div>
                  <div className={styles.optionTitle}>Change Password</div>
                  <div className={styles.optionSub}>
                    Update current password or request a reset link
                  </div>
                </div>
              </div>
            </button>

            {/* Danger Zone */}
            <div className={styles.dangerZone}>
              <div className={styles.dangerZoneTitle}>Danger Zone</div>
              <p className={styles.dangerZoneDesc}>
                Permanently delete your account, personal calendar, and memberships. This cannot be undone.
              </p>
              <button
                type="button"
                className={styles.deleteAccountTriggerBtn}
                onClick={() => {
                  onClose();
                  onOpenDeleteAccount();
                }}
              >
                <Trash2 size={13} /> Delete Account
              </button>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.doneButton}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Change Password Pop-up */}
      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userEmail={userEmail}
      />
    </>
  );
}
