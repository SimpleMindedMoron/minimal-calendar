"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import styles from "./sign-out-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignOut: () => Promise<void>;
};

export function SignOutDialog({ isOpen, onClose, onConfirmSignOut }: Props) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirmSignOut();
    } catch (err) {
      console.error("Sign out error:", err);
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={loading ? undefined : onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-out-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <LogOut size={22} />
          </div>
          <h2 id="sign-out-title" className={styles.title}>
            Sign Out
          </h2>
          <p className={styles.subtitle}>
            Are you sure you want to sign out of your account?
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Signing out...
              </>
            ) : (
              "Yes, Sign Out"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
