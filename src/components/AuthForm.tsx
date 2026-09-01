"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload =
      mode === "signup"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            password: form.get("password"),
          }
        : { email: form.get("email"), password: form.get("password") };

    try {
      const res = await fetch(`/api/auth/${mode === "signup" ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="label-field" htmlFor="name">Full name</label>
          <input id="name" name="name" required className="input-field" placeholder="Jordan Rivera" />
        </div>
      )}
      <div>
        <label className="label-field" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input-field" placeholder="you@example.com" />
      </div>
      {mode === "signup" && (
        <div>
          <label className="label-field" htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" className="input-field" placeholder="(555) 019-2244" />
        </div>
      )}
      <div>
        <label className="label-field" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
