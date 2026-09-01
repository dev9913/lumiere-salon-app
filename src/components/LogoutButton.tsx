"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ scope = "customer" }: { scope?: "customer" | "admin" }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch(scope === "admin" ? "/api/admin/logout" : "/api/auth/logout", { method: "POST" });
        router.push(scope === "admin" ? "/admin/login" : "/");
        router.refresh();
      }}
      className="btn-secondary !px-4 !py-2 text-sm"
    >
      Log out
    </button>
  );
}
