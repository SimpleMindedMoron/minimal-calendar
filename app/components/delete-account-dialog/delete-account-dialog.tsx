"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import styles from "./delete-account-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  userEmail?: string;
};

export function DeleteAccountDialog({
  isOpen,
  onClose,
  onConfirmDelete,
  userEmail,
}: Props) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim() === "DELETE";

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || loading) return;

    try {
      setLoading(true);
      setError(null);
      await onConfirmDelete();
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      setError(err?.message || "An error occurred while deleting your account.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setConfirmationInput("");
    setError(null);
    onClose();
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={handleClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.warningIconWrapper}>
            <AlertTriangle size={24} />
          </div>
          <h2 id="delete-account-title" className={styles.title}>
            Delete Account
          </h2>
          <p className={styles.subtitle}>
            Are you sure you want to permanently delete your account
            {userEmail ? ` (${userEmail})` : ""}?
          </p>
        </div>

        <div className={styles.warningBox}>
          <ul>
            <li>Your personal calendar and events will be permanently deleted.</li>
            <li>You will be removed from all shared rooms.</li>
            <li>This action cannot be undone.</li>
          </ul>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleDelete}>
          <label className={styles.field}>
            <span>
              Type <b>DELETE</b> to confirm:
            </span>
            <input
              type="text"
              required
              disabled={loading}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
          </label>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.deleteBtn}
              disabled={!isConfirmed || loading}
            >
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Loader2 size={16} className="animate-spin" /> Deleting...
                </span>
              ) : (
                "Permanently Delete"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
