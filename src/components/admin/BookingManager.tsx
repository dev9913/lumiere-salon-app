"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice, formatSlotLabel, STATUS_STYLES } from "@/lib/utils";

type BookingRow = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  priceCents: number;
  serviceName: string;
  staffName: string;
  customerName: string;
  customerEmail: string;
  notes: string | null;
};

const FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export default function BookingManager({ bookings, activeStatus }: { bookings: BookingRow[]; activeStatus: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${f}`}
            className={`border px-3 py-1.5 text-sm ${activeStatus === f ? "border-rosewood bg-rosewood text-parchment" : "border-line text-ink/70"}`}
          >
            {f[0] + f.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      <div className="divide-y divide-line border-t border-line">
        {bookings.length === 0 && <p className="py-6 text-sm text-ink/50">No bookings match this filter.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-medium text-ink">{b.serviceName} — {b.customerName}</p>
              <p className="text-sm text-ink/50">
                {b.customerEmail} · with {b.staffName} · {formatSlotLabel(b.startsAt)} · {formatPrice(b.priceCents)}
              </p>
              {b.notes && <p className="mt-1 text-sm italic text-ink/50">&ldquo;{b.notes}&rdquo;</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>{b.status}</span>
              {NEXT_STATUS[b.status].map((next) => (
                <button
                  key={next}
                  disabled={busyId === b.id}
                  onClick={() => updateStatus(b.id, next)}
                  className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-50"
                >
                  Mark {next.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
