"use client";

import { useState } from "react";
import styles from "./login-form.module.css";

type Message = { text: string; type: "error" | "success" } | null;

interface LoginFormProps {
  loading: boolean;
  message: Message;
  onSignIn: (email: string, pass: string) => Promise<void>;
  onSignUp: (email: string, pass: string) => Promise<void>;
}

export function LoginForm({ loading, message, onSignIn, onSignUp }: LoginFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "signin") {
      await onSignIn(email, password);
    } else {
      await onSignUp(email, password);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${mode === "signin" ? styles.activeTab : ""}`}
          onClick={() => setMode("signin")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === "signup" ? styles.activeTab : ""}`}
          onClick={() => setMode("signup")}
        >
          Create Account
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
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
            minLength={6}
          />
        </label>
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
