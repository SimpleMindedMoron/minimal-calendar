"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import styles from "./change-password-dialog.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
};

export function ChangePasswordDialog({ isOpen, onClose, userEmail }: Props) {
  const [step, setStep] = useState<"verify" | "new_password">("verify");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setStep("verify");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
    onClose();
  };

  // Step 1: Verify current password
  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    if (!currentPassword) {
      setMessage({ text: "Please enter your current password.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setMessage({
          text: "Current password is incorrect. Click 'Forgot password?' if you need a reset link.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Password is correct! Advance to Step 2
      setLoading(false);
      setMessage(null);
      setStep("new_password");
    } catch (err: any) {
      setMessage({
        text: err?.message || "Failed to verify current password.",
        type: "error",
      });
      setLoading(false);
    }
  };

  // Step 2: Set new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    if (newPassword.length < 6) {
      setMessage({ text: "New password must be at least 6 characters.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setMessage({ text: updateError.message, type: "error" });
      } else {
        setMessage({
          text: "Password updated successfully!",
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setMessage({
        text: err?.message || "An error occurred while updating password.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!userEmail) return;
    setLoading(true);
    setMessage(null);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({
          text: `Password reset link sent to ${userEmail}. Check your inbox.`,
          type: "success",
        });
      }
    } catch (err: any) {
      setMessage({
        text: err?.message || "Failed to send reset email.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={handleClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            {step === "verify" ? <KeyRound size={22} /> : <ShieldCheck size={22} />}
          </div>
          <h2 id="change-password-title" className={styles.title}>
            {step === "verify" ? "Verify Current Password" : "Set New Password"}
          </h2>
          <p className={styles.subtitle}>
            {step === "verify"
              ? "Please enter your current password to continue."
              : "Choose and confirm your new account password."}
          </p>
        </div>

        {message && (
          <div
            className={`${styles.statusMessage} ${
              message.type === "error"
                ? styles.statusError
                : styles.statusSuccess
            }`}
            style={{ marginBottom: "1rem" }}
          >
            {message.text}
          </div>
        )}

        {step === "verify" ? (
          <form onSubmit={handleVerifyCurrentPassword} className={styles.form}>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.label} htmlFor="current-pwd">
                  Current Password
                </label>
                <button
                  type="button"
                  className={styles.forgotPasswordBtn}
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="current-pwd"
                type="password"
                required
                disabled={loading}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter current password"
                autoFocus
              />
            </div>

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
                className={styles.saveBtn}
                disabled={loading || !currentPassword.trim()}
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Loader2 size={15} className="animate-spin" /> Verifying...
                  </span>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetNewPassword} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-pwd">
                New Password
              </label>
              <input
                id="new-pwd"
                type="password"
                required
                disabled={loading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                placeholder="Min 6 characters"
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-pwd">
                Confirm New Password
              </label>
              <input
                id="confirm-pwd"
                type="password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="Repeat new password"
              />
            </div>

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
                className={styles.saveBtn}
                disabled={
                  loading || !newPassword || !confirmPassword
                }
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Loader2 size={15} className="animate-spin" /> Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
