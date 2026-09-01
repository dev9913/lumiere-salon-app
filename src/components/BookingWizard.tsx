"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDays, isSameDay, startOfDay } from "date-fns";
import { formatPrice, formatDuration, formatDayLabel, formatTimeLabel } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  slug: string;
  durationMins: number;
  priceCents: number;
  staff: { staffId: string }[];
};
type Category = { id: string; name: string; icon: string | null; services: Service[] };
type Staff = { id: string; name: string; title: string; photoUrl: string | null; services: { serviceId: string }[] };

const STEPS = ["Service", "Stylist", "Date & Time", "Confirm"] as const;

export default function BookingWizard({
  categories,
  staff,
  isLoggedIn,
  initialServiceId,
  initialStaffId,
}: {
  categories: Category[];
  staff: Staff[];
  isLoggedIn: boolean;
  initialServiceId?: string;
  initialStaffId?: string;
}) {
  const router = useRouter();
  const allServices = useMemo(() => categories.flatMap((c) => c.services.map((s) => ({ ...s, categoryName: c.name }))), [categories]);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [slots, setSlots] = useState<{ startsAt: string; endsAt: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const selectedService = allServices.find((s) => s.id === serviceId);
  const eligibleStaff = staff.filter((s) => s.services.some((x) => x.serviceId === serviceId));
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)), []);

  useEffect(() => {
    if (!staffId || !serviceId || !selectedDay) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`/api/staff/${staffId}/availability?serviceId=${serviceId}&from=${selectedDay.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        const daySlots = (data.slots ?? []).filter((s: any) => isSameDay(new Date(s.startsAt), selectedDay));
        setSlots(daySlots);
      })
      .finally(() => setLoadingSlots(false));
  }, [staffId, serviceId, selectedDay]);

  async function handleConfirm() {
    if (!selectedSlot || !serviceId || !staffId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, staffId, startsAt: selectedSlot, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (res.status === 409) setSelectedSlot(null);
        return;
      }
      setConfirmedBookingId(data.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedBookingId) {
    return (
      <div className="mx-auto max-w-lg border border-sage/40 bg-sage/10 p-8 text-center">
        <p className="text-3xl">✓</p>
        <h2 className="mt-3 font-display text-2xl text-ink">Appointment requested</h2>
        <p className="mt-2 text-sm text-ink/60">
          We&rsquo;ve sent your request for <strong>{selectedService?.name}</strong>. It&rsquo;s marked as{" "}
          <strong>pending</strong> until the salon confirms it — you&rsquo;ll see updates in your account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => router.push("/account/bookings")} className="btn-primary">
            View my bookings
          </button>
          <button onClick={() => router.push("/")} className="btn-secondary">
            Back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <ol className="mb-10 flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 border px-3 py-1.5 ${
              i === step ? "border-rosewood bg-rosewood/5 text-rosewood" : "border-line text-ink/40"
            }`}
          >
            <span className="font-semibold">{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {/* Step 0: service */}
      {step === 0 && (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.id}>
              <p className="mb-3 flex items-center gap-2 font-display text-lg text-ink">
                <span>{cat.icon}</span> {cat.name}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {cat.services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setStaffId("");
                      setSelectedDay(null);
                      setStep(1);
                    }}
                    className={`card flex items-center justify-between p-4 text-left transition hover:border-rosewood ${
                      serviceId === s.id ? "border-rosewood" : ""
                    }`}
                  >
                    <span>
                      <span className="block font-medium text-ink">{s.name}</span>
                      <span className="block text-xs text-ink/50">{formatDuration(s.durationMins)}</span>
                    </span>
                    <span className="font-semibold text-ink">{formatPrice(s.priceCents)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 1: stylist */}
      {step === 1 && selectedService && (
        <div>
          <p className="mb-4 text-sm text-ink/60">
            Booking <strong className="text-ink">{selectedService.name}</strong> — choose your stylist.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {eligibleStaff.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setStaffId(s.id);
                  setSelectedDay(days[0]);
                  setStep(2);
                }}
                className={`card p-4 text-left transition hover:border-rosewood ${staffId === s.id ? "border-rosewood" : ""}`}
              >
                <p className="font-medium text-ink">{s.name}</p>
                <p className="text-xs text-ink/50">{s.title}</p>
              </button>
            ))}
            {eligibleStaff.length === 0 && <p className="text-sm text-ink/50">No stylists currently offer this service.</p>}
          </div>
          <button onClick={() => setStep(0)} className="btn-ghost mt-6">← Change service</button>
        </div>
      )}

      {/* Step 2: date & time */}
      {step === 2 && (
        <div>
          <p className="mb-4 text-sm text-ink/60">Pick a day within the next 14 days, then an open time.</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDay(d)}
                className={`shrink-0 border px-3 py-2 text-xs font-medium ${
                  selectedDay && isSameDay(selectedDay, d) ? "border-rosewood bg-rosewood text-parchment" : "border-line text-ink/70 hover:border-rosewood"
                }`}
              >
                {formatDayLabel(d)}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {loadingSlots && <p className="text-sm text-ink/50">Loading times…</p>}
            {!loadingSlots && slots.length === 0 && (
              <p className="text-sm text-ink/50">No open times this day — try another date.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.startsAt}
                  onClick={() => setSelectedSlot(s.startsAt)}
                  className={`border px-4 py-2 text-sm ${
                    selectedSlot === s.startsAt ? "border-rosewood bg-rosewood text-parchment" : "border-line hover:border-rosewood"
                  }`}
                >
                  {formatTimeLabel(s.startsAt)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(1)} className="btn-ghost">← Change stylist</button>
            <button disabled={!selectedSlot} onClick={() => setStep(3)} className="btn-primary">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: confirm */}
      {step === 3 && selectedService && selectedSlot && (
        <div className="max-w-lg">
          <div className="card space-y-2 p-6 text-sm">
            <p className="flex justify-between"><span className="text-ink/50">Service</span><span className="font-medium">{selectedService.name}</span></p>
            <p className="flex justify-between"><span className="text-ink/50">Stylist</span><span className="font-medium">{eligibleStaff.find((s) => s.id === staffId)?.name}</span></p>
            <p className="flex justify-between"><span className="text-ink/50">When</span><span className="font-medium">{formatDayLabel(new Date(selectedSlot))} at {formatTimeLabel(selectedSlot)}</span></p>
            <p className="flex justify-between"><span className="text-ink/50">Duration</span><span className="font-medium">{formatDuration(selectedService.durationMins)}</span></p>
            <p className="flex justify-between border-t border-line pt-2"><span className="text-ink/50">Estimated price</span><span className="font-semibold">{formatPrice(selectedService.priceCents)}</span></p>
          </div>

          <label className="label-field mt-6">Notes for your stylist (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input-field" placeholder="Allergies, inspiration photos, requests…" />

          {error && <p className="mt-4 border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}

          {!isLoggedIn && (
            <p className="mt-4 text-sm text-gold">Log in or create an account above before confirming.</p>
          )}

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(2)} className="btn-ghost">← Change time</button>
            <button onClick={handleConfirm} disabled={submitting || !isLoggedIn} className="btn-primary">
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
