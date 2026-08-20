"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "../components/login-form/login-form";
import styles from "./page.module.css";
import { supabase } from "../../lib/supabase";
import { RoomDialog } from "./components/room-dialog/room-dialog";

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
    } else router.push("/");
  };

  return (
    <main className={styles.page}>
      <LoginForm
        loading={loading}
        message={message}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </main>
  );
}
