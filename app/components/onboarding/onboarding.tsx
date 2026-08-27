import { useState } from "react";
import styles from "./onboarding.module.css";
import { supabase } from "../../../lib/supabase";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() }
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Welcome to Align</h1>
        <p className={styles.subtitle}>
          Your email has been verified. Before we start, what should we call you?
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Full Name
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoFocus
            />
          </label>
          <button type="submit" disabled={loading || !fullName.trim()} className={styles.submitButton}>
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
