"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import styles from "../page.module.css";

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Listen for recovery state or verify session
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          console.log("Password recovery session active");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        // Sign out to enforce clean login with new password
        await supabase.auth.signOut();
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update password.");
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.appShell}
      style={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        className={styles.page}
        style={{ maxWidth: "420px", width: "100%" }}
      >
        <div
          className={`${styles.letterhead} animate-in`}
          style={{
            justifyContent: "center",
            borderBottom: "none",
            marginBottom: "28px",
            paddingBottom: 0,
            animationDelay: "100ms",
          }}
        >
          <div className={styles.mark}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                className={styles.roomSelectWrapper}
                style={{ justifyContent: "center", pointerEvents: "none" }}
              >
                <h1>Align</h1>
              </div>
              <div className={styles.sub} style={{ justifyContent: "center" }}>
                <span>Shared calendar platform</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${styles.panel} animate-in`}
          style={{ animationDelay: "200ms", padding: "28px 24px" }}
        >
          {isSuccess ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "16px",
                padding: "20px 8px",
              }}
            >
              <CheckCircle2 size={48} color="var(--gold)" />
              <h2
                style={{
                  fontFamily: "'Pilcrow Rounded', sans-serif",
                  fontSize: "22px",
                  color: "var(--ink)",
                  fontWeight: 500,
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                Password Updated!
              </h2>
              <p
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: "13.5px",
                  color: "var(--ink-dim)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Your password has been successfully reset. Please log in with your new password.
              </p>

              <Link
                href="/login?reset=true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "12px",
                  padding: "10px 24px",
                  borderRadius: "12px",
                  border: "2px solid var(--rule)",
                  background: "var(--gold)",
                  color: "var(--bg)",
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "2px 2px 0px 0px var(--rule)",
                  transition: "all 0.15s ease",
                  width: "100%",
                }}
              >
                Go to Login <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <KeyRound size={20} color="var(--gold)" />
                <h2
                  style={{
                    fontFamily: "'Pilcrow Rounded', sans-serif",
                    fontSize: "20px",
                    color: "var(--ink)",
                    fontWeight: 500,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Set New Password
                </h2>
              </div>
              <p
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: "13px",
                  color: "var(--ink-dim)",
                  margin: "0 0 4px 0",
                  lineHeight: 1.4,
                }}
              >
                Please enter and confirm your new account password.
              </p>

              {error && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(255, 68, 68, 0.12)",
                    color: "#ff4d4d",
                    border: "1px solid rgba(255, 68, 68, 0.3)",
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "12.5px",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  htmlFor="new-password"
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ink-faint)",
                  }}
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{
                    width: "100%",
                    minHeight: "2.75rem",
                    padding: "0.65rem 0.75rem",
                    border: "2px solid var(--rule)",
                    borderRadius: "12px",
                    background: "var(--surface-raised)",
                    color: "var(--ink)",
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "14px",
                    boxShadow: "2px 2px 0px 0px var(--shadow)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label
                  htmlFor="confirm-password"
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ink-faint)",
                  }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  style={{
                    width: "100%",
                    minHeight: "2.75rem",
                    padding: "0.65rem 0.75rem",
                    border: "2px solid var(--rule)",
                    borderRadius: "12px",
                    background: "var(--surface-raised)",
                    color: "var(--ink)",
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: "14px",
                    boxShadow: "2px 2px 0px 0px var(--shadow)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                style={{
                  marginTop: "8px",
                  minHeight: "2.75rem",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "12px",
                  border: "2px solid var(--rule)",
                  background: "var(--gold)",
                  color: "var(--bg)",
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "2px 2px 0px 0px var(--rule)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Updating...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <Link
                href="/login"
                style={{
                  textAlign: "center",
                  marginTop: "4px",
                  color: "var(--ink-dim)",
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: "12px",
                  textDecoration: "none",
                }}
              >
                Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
