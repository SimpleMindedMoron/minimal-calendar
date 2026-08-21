"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "../components/login-form/login-form";
import styles from "../page.module.css";
import { supabase } from "../../lib/supabase";

type Message = { text: string; type: "error" | "success" } | null;

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(
      error
        ? { text: error.message, type: "error" }
        : {
            text: "Success! Check your email to confirm your account.",
            type: "success",
          },
    );
    setLoading(false);
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
        {/* Same Letterhead as the main app */}
        <div className={styles.letterhead} style={{ justifyContent: "center", borderBottom: "none", marginBottom: "32px", paddingBottom: 0 }}>
          <div className={styles.mark}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div className={styles.roomSelectWrapper} style={{ justifyContent: "center" }}>
                <h1>Align</h1>
              </div>
              <div className={styles.sub} style={{ justifyContent: "center" }}>
                <span>Shared calendar platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Box Panel for the form */}
        <div className={styles.panel}>
          <LoginForm
            loading={loading}
            message={message}
            onSignIn={signIn}
            onSignUp={signUp}
          />
        </div>
      </div>
    </div>
  );
}
