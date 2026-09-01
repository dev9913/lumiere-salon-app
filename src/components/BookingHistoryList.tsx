"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatSlotLabel, formatDayLabel, formatTimeLabel, STATUS_STYLES } from "@/lib/utils";
import { addDays, isSameDay, startOfDay } from "date-fns";

type Booking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  priceCents: number;
  notes: string | null;
  service: { id: string; name: string; durationMins: number };
  staff: { id: string; name: string };
};

export default function BookingHistoryList({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const upcoming = bookings.filter((b) => (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.startsAt) > new Date());
  const past = bookings.filter((b) => !upcoming.includes(b));

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment? This can't be undone.")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't cancel this booking.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-12">
      {error && <p className="border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}

      <div>
        <h2 className="font-display text-xl text-ink">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">No upcoming appointments.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((b) => (
              <div key={b.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{b.service.name}</p>
                    <p className="text-sm text-ink/50">with {b.staff.name} · {formatSlotLabel(b.startsAt)}</p>
                    <p className="mt-1 text-sm font-medium text-ink">{formatPrice(b.priceCents)}</p>
                  </div>
                  <span className={`border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setReschedulingId(reschedulingId === b.id ? null : b.id)}
                    className="btn-secondary !px-4 !py-2 text-sm"
                  >
                    {reschedulingId === b.id ? "Close" : "Reschedule"}
                  </button>
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={busyId === b.id}
                    className="text-sm font-medium text-rosewood hover:underline disabled:opacity-50"
                  >
                    {busyId === b.id ? "Cancelling…" : "Cancel"}
                  </button>
                </div>
                {reschedulingId === b.id && (
                  <RescheduleForm
                    bookingId={b.id}
                    staffId={b.staff.id}
                    serviceId={b.service.id}
                    onDone={() => {
                      setReschedulingId(null);
                      router.refresh();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl text-ink">Past &amp; cancelled</h2>
        {past.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">Nothing here yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {past.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-line py-3 text-sm">
                <div>
                  <span className="font-medium text-ink">{b.service.name}</span>{" "}
                  <span className="text-ink/50">· {formatSlotLabel(b.startsAt)}</span>
                </div>
                <span className={`border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RescheduleForm({
  bookingId,
  staffId,
  serviceId,
  onDone,
}: {
  bookingId: string;
  staffId: string;
  serviceId: string;
  onDone: () => void;
}) {
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [slots, setSlots] = useState<{ startsAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSlots(day: Date) {
    setSelectedDay(day);
    setLoading(true);
    const res = await fetch(`/api/staff/${staffId}/availability?serviceId=${serviceId}&from=${day.toISOString()}`);
    const data = await res.json();
    setSlots((data.slots ?? []).filter((s: any) => isSameDay(new Date(s.startsAt), day)));
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSlots(days[0]);
  }, []);

  async function confirmSlot(startsAt: string) {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't reschedule.");
      return;
    }
    onDone();
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button
            key={d.toISOString()}
            onClick={() => loadSlots(d)}
            className={`shrink-0 border px-3 py-1.5 text-xs font-medium ${
              isSameDay(selectedDay, d) ? "border-rosewood bg-rosewood text-parchment" : "border-line text-ink/70"
            }`}
          >
            {formatDayLabel(d)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && slots.length === 0 && <p className="text-sm text-ink/50">No open times this day.</p>}
        {slots.map((s) => (
          <button
            key={s.startsAt}
            disabled={submitting}
            onClick={() => confirmSlot(s.startsAt)}
            className="border border-line px-3 py-1.5 text-sm hover:border-rosewood disabled:opacity-50"
          >
            {formatTimeLabel(s.startsAt)}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-rosewood">{error}</p>}
    </div>
  );
}
