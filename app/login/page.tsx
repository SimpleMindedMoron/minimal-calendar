"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Success! Check your email to confirm your account.", type: "success" });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // If successful, redirect to the dashboard (home page)
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm bg-[#1A1B26] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <h1 className="text-2xl font-light tracking-tight text-white mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-gray-400 mb-8">Sign in to your minimal calendar</p>

        {message && (
          <div className={`p-3 mb-6 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {message.text}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-gray-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-gray-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Sign In"}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-3 bg-transparent text-gray-400 border border-gray-700 rounded-lg font-medium hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}