"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { LoginForm } from "../components/login-form/login-form";
import styles from "../page.module.css";
import { supabase } from "../../lib/supabase";

type Message = { text: string; type: "error" | "success" } | null;

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
    } else {
      setIsCheckingEmail(true);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className={styles.appShell} style={{ minHeight: "100vh", alignItems: "center" }}>
      <div
        className={styles.page}
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <div className={styles.letterhead} style={{ justifyContent: "center", borderBottom: "none", marginBottom: "32px", paddingBottom: 0 }}>
          <div className={styles.mark}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div className={styles.roomSelectWrapper} style={{ justifyContent: "center", pointerEvents: "none" }}>
                <h1>Align</h1>
              </div>
              <div className={styles.sub} style={{ justifyContent: "center" }}>
                <span>Shared calendar platform</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          {isCheckingEmail ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", padding: "32px 16px" }}>
              <MailCheck size={48} color="var(--gold)" />
              <h2 style={{ fontFamily: "'Pilcrow Rounded', sans-serif", fontSize: "20px", color: "var(--ink)", fontWeight: 500, fontStyle: "italic" }}>
                Check your email
              </h2>
              <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: "14px", color: "var(--ink-dim)", lineHeight: 1.5 }}>
                We've sent a confirmation link to your email address. Please click it to verify your account.
              </p>
            </div>
          ) : (
            <LoginForm
              loading={loading}
              message={message}
              onSignIn={signIn}
              onSignUp={signUp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
