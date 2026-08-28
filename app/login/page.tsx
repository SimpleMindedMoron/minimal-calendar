"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, CheckCircle2 } from "lucide-react";
import { LoginForm } from "../components/login-form/login-form";
import styles from "../page.module.css";
import { supabase } from "../../lib/supabase";

type Message = { text: string; type: "error" | "success" } | null;

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isWelcomeBack, setIsWelcomeBack] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const pollCredentials = useRef({ email: "", password: "" });

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
      pollCredentials.current = { email, password };
      setIsCheckingEmail(true);
    }
  };

  useEffect(() => {
    if (!isCheckingEmail) return;

    const interval = setInterval(async () => {
      const { email, password } = pollCredentials.current;
      if (!email || !password) return;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.session && !error) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => router.push("/"), 400);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isCheckingEmail, router]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
    } else {
      const name = data.user?.user_metadata?.full_name || "there";
      setWelcomeName(name);
      setIsWelcomeBack(true);
      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          router.push("/");
        }, 300);
      }, 900);
    }
  };

  return (
    <div 
      className={styles.appShell} 
      style={{ 
        minHeight: "100vh", 
        alignItems: "center",
        opacity: isFadingOut ? 0 : 1,
        transition: "opacity 400ms ease",
        pointerEvents: isFadingOut ? "none" : "auto"
      }}
    >
      <div
        className={styles.page}
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <div className={`${styles.letterhead} animate-in`} style={{ justifyContent: "center", borderBottom: "none", marginBottom: "32px", paddingBottom: 0, animationDelay: "100ms" }}>
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

        <div className={`${styles.panel} animate-in`} style={{ animationDelay: "200ms" }}>
          {isCheckingEmail ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", padding: "32px 16px", animation: "fade-in 400ms ease" }}>
              <MailCheck size={48} color="var(--gold)" />
              <h2 style={{ fontFamily: "'Pilcrow Rounded', sans-serif", fontSize: "20px", color: "var(--ink)", fontWeight: 500, fontStyle: "italic" }}>
                Check your email
              </h2>
              <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: "14px", color: "var(--ink-dim)", lineHeight: 1.5 }}>
                We've sent a confirmation link to your email address. Please click it to verify your account.
              </p>
            </div>
          ) : isWelcomeBack ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", padding: "40px 16px", animation: "fade-in 500ms ease forwards, slide-up 500ms ease forwards" }}>
              <style>{`
                @keyframes slide-up {
                  from { transform: translateY(10px); }
                  to { transform: translateY(0); }
                }
              `}</style>
              <CheckCircle2 size={48} color="var(--gold)" style={{ animation: "scale-in 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }} />
              <style>{`
                @keyframes scale-in {
                  from { transform: scale(0.5); opacity: 0; }
                  to { transform: scale(1); opacity: 1; }
                }
              `}</style>
              <h2 style={{ fontFamily: "'Pilcrow Rounded', sans-serif", fontSize: "24px", color: "var(--ink)", fontWeight: 500, fontStyle: "italic" }}>
                Welcome, {welcomeName}!
              </h2>
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
