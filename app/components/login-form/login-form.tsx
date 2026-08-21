"use client";

import { useState } from "react";
import styles from "./login-form.module.css";

type Props = {
  loading: boolean;
  message: { text: string; type: "error" | "success" } | null;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
};

export function LoginForm({ loading, message, onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      void onSignIn(email, password);
    } else {
      void onSignUp(email, password);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.markGlyph}>Lg</div>
      <h1 className={styles.title}>Agendly</h1>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${mode === "signin" ? styles.activeTab : ""}`}
          onClick={() => {
            setMode("signin");
            setEmail("");
            setPassword("");
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === "signup" ? styles.activeTab : ""}`}
          onClick={() => {
            setMode("signup");
            setEmail("");
            setPassword("");
          }}
        >
          Create Account
        </button>
      </div>

      {message && (
        <div
          className={`${styles.message} ${message.type === "error" ? styles.error : styles.success}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className={styles.field}>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading
            ? "Processing..."
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
    </div>
  );
}
