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
    <div className={styles.appShell}>
      <div className={styles.page} style={{ maxWidth: "600px", marginTop: "10vh" }}>
        
        {/* Same Letterhead as the main app */}
        <div className={styles.letterhead}>
          <div className={styles.mark}>
            <div className={styles.markGlyph}>Lg</div>
            <div>
              <div className={styles.roomSelectWrapper}>
                <h1>Agendly</h1>
              </div>
              <div className={styles.sub}>
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
