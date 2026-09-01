"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-field" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input-field" placeholder="admin@lumiere-salon.com" />
      </div>
      <div>
        <label className="label-field" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="input-field" />
      </div>
      {error && <p className="border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Please wait…" : "Log in"}
      </button>
    </form>
  );
}
