"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type StaffRow = {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  isActive: boolean;
  serviceIds: string[];
};

export default function StaffManager({ initial, services }: { initial: StaffRow[]; services: { id: string; name: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<StaffRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editingRow = editing === "new" ? null : editing;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const serviceIds = services.filter((s) => form.get(`svc-${s.id}`)).map((s) => s.id);
    const payload = {
      name: form.get("name"),
      title: form.get("title"),
      bio: form.get("bio"),
      photoUrl: form.get("photoUrl") || undefined,
      isActive: form.get("isActive") === "on",
      serviceIds,
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/staff" : `/api/staff/${(editing as StaffRow).id}`;
    try {
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this staff member? If they have bookings they'll be deactivated instead.")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <button onClick={() => setEditing("new")} className="btn-primary mb-6">+ Add staff member</button>

      {editing && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-4 p-6">
          <h3 className="font-display text-lg text-ink">{editing === "new" ? "New staff member" : `Edit: ${editingRow!.name}`}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Name</label>
              <input name="name" required defaultValue={editingRow?.name} className="input-field" />
            </div>
            <div>
              <label className="label-field">Title</label>
              <input name="title" required defaultValue={editingRow?.title} className="input-field" placeholder="Senior Colorist" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Photo URL</label>
              <input name="photoUrl" defaultValue={editingRow?.photoUrl ?? ""} className="input-field" placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Bio</label>
              <textarea name="bio" required rows={3} defaultValue={editingRow?.bio} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-field">Services offered</label>
            <div className="flex flex-wrap gap-3">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`svc-${s.id}`} defaultChecked={editingRow?.serviceIds.includes(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={editingRow?.isActive ?? true} />
            Active
          </label>

          {error && <p className="border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="divide-y divide-line border-t border-line">
        {initial.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-ink">{s.name} {!s.isActive && <span className="ml-2 text-xs text-ink/40">(inactive)</span>}</p>
              <p className="text-sm text-ink/50">{s.title}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={`/admin/availability?staffId=${s.id}`} className="text-ink/60 hover:text-rosewood">Schedule</Link>
              <button onClick={() => setEditing(s)} className="text-rosewood hover:underline">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="text-ink/50 hover:text-rosewood">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
