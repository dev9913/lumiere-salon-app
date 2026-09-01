"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minToTime(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function timeToMin(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

type ScheduleEntry = { id?: string; dayOfWeek: number; startMin: number; endMin: number };
type TimeOffEntry = { id: string; date: string; startMin: number | null; endMin: number | null; reason: string | null };

export default function AvailabilityManager({
  staff,
  activeStaffId,
  initialSchedules,
  initialTimeOff,
}: {
  staff: { id: string; name: string }[];
  activeStaffId: string | null;
  initialSchedules: ScheduleEntry[];
  initialTimeOff: TimeOffEntry[];
}) {
  const router = useRouter();
  const [days, setDays] = useState(() => {
    const map = new Map(initialSchedules.map((s) => [s.dayOfWeek, s]));
    return DAYS.map((_, i) => ({
      enabled: map.has(i),
      startMin: map.get(i)?.startMin ?? 540, // 9:00
      endMin: map.get(i)?.endMin ?? 1020, // 17:00
    }));
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeOff, setTimeOff] = useState(initialTimeOff);
  const [newOffDate, setNewOffDate] = useState("");
  const [newOffReason, setNewOffReason] = useState("");

  if (!activeStaffId) return <p className="text-sm text-ink/50">Add a staff member first.</p>;

  async function saveSchedule() {
    setSaving(true);
    setError(null);
    const entries = days
      .map((d, i) => ({ dayOfWeek: i, startMin: d.startMin, endMin: d.endMin, enabled: d.enabled }))
      .filter((d) => d.enabled)
      .map(({ dayOfWeek, startMin, endMin }) => ({ dayOfWeek, startMin, endMin }));

    const res = await fetch(`/api/admin/staff/${activeStaffId}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save schedule.");
      return;
    }
    router.refresh();
  }

  async function addTimeOff() {
    if (!newOffDate) return;
    const res = await fetch(`/api/admin/staff/${activeStaffId}/timeoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newOffDate, reason: newOffReason || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setTimeOff((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewOffDate("");
      setNewOffReason("");
    }
  }

  async function removeTimeOff(entryId: string) {
    await fetch(`/api/admin/staff/${activeStaffId}/timeoff?entryId=${entryId}`, { method: "DELETE" });
    setTimeOff((prev) => prev.filter((t) => t.id !== entryId));
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {staff.map((s) => (
          <a
            key={s.id}
            href={`/admin/availability?staffId=${s.id}`}
            className={`border px-3 py-1.5 text-sm ${s.id === activeStaffId ? "border-rosewood bg-rosewood text-parchment" : "border-line text-ink/70"}`}
          >
            {s.name}
          </a>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg text-ink">Weekly hours</h3>
        <div className="mt-4 space-y-3">
          {DAYS.map((label, i) => (
            <div key={label} className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex w-32 items-center gap-2">
                <input
                  type="checkbox"
                  checked={days[i].enabled}
                  onChange={(e) =>
                    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, enabled: e.target.checked } : d)))
                  }
                />
                {label}
              </label>
              {days[i].enabled && (
                <>
                  <input
                    type="time"
                    value={minToTime(days[i].startMin)}
                    onChange={(e) =>
                      setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, startMin: timeToMin(e.target.value) } : d)))
                    }
                    className="border border-line px-2 py-1"
                  />
                  <span className="text-ink/40">to</span>
                  <input
                    type="time"
                    value={minToTime(days[i].endMin)}
                    onChange={(e) =>
                      setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, endMin: timeToMin(e.target.value) } : d)))
                    }
                    className="border border-line px-2 py-1"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        {error && <p className="mt-3 border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}
        <button onClick={saveSchedule} disabled={saving} className="btn-primary mt-5">
          {saving ? "Saving…" : "Save weekly hours"}
        </button>
      </div>

      <div className="card mt-8 p-6">
        <h3 className="font-display text-lg text-ink">Time off &amp; exceptions</h3>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label-field">Date</label>
            <input type="date" value={newOffDate} onChange={(e) => setNewOffDate(e.target.value)} className="input-field" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="label-field">Reason (optional)</label>
            <input value={newOffReason} onChange={(e) => setNewOffReason(e.target.value)} className="input-field" placeholder="Vacation" />
          </div>
          <button onClick={addTimeOff} className="btn-secondary">Add whole day off</button>
        </div>

        <div className="mt-6 divide-y divide-line border-t border-line">
          {timeOff.length === 0 && <p className="py-3 text-sm text-ink/50">No upcoming exceptions.</p>}
          {timeOff.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                {t.date} {t.startMin != null ? `· ${minToTime(t.startMin)}–${minToTime(t.endMin!)}` : "· all day"}
                {t.reason && <span className="text-ink/50"> — {t.reason}</span>}
              </span>
              <button onClick={() => removeTimeOff(t.id)} className="text-ink/50 hover:text-rosewood">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
