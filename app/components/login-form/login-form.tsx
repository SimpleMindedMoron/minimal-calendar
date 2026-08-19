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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>Sign in to your minimal calendar</p>
      {message && (
        <div
          className={`${styles.message} ${message.type === "error" ? styles.error : styles.success}`}
        >
          {message.text}
        </div>
      )}
      <form className={styles.form}>
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
        <div className={styles.actions}>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onSignIn(email, password)}
            className={styles.signIn}
          >
            {loading ? "Loading..." : "Sign In"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onSignUp(email, password)}
            className={styles.signUp}
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
