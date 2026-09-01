"use client";

import Link from "next/link";
import { useState } from "react";

export default function MobileNav({
  links,
  isLoggedIn,
}: {
  links: { href: string; label: string }[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span className={`h-px w-6 bg-ink transition ${open ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`h-px w-6 bg-ink transition ${open ? "opacity-0" : ""}`} />
        <span className={`h-px w-6 bg-ink transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-line bg-parchment px-4 pb-6 pt-2 shadow-card">
          <nav className="flex flex-col divide-y divide-line">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-ink"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              onClick={() => setOpen(false)}
              className="py-3 text-base font-medium text-ink"
            >
              {isLoggedIn ? "My Account" : "Log in"}
            </Link>
          </nav>
          <Link href="/book" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
            Book Now
          </Link>
        </div>
      )}
    </div>
  );
}
