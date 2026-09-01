"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDuration } from "@/lib/utils";

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  durationMins: number;
  priceCents: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
  staffIds: string[];
};

export default function ServiceManager({
  initialServices,
  categories,
  staff,
}: {
  initialServices: ServiceRow[];
  categories: { id: string; name: string }[];
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ServiceRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const staffIds = staff.filter((s) => form.get(`staff-${s.id}`)).map((s) => s.id);

    const payload = {
      name: form.get("name"),
      categoryId: form.get("categoryId"),
      description: form.get("description"),
      durationMins: Number(form.get("durationMins")),
      priceCents: Math.round(Number(form.get("price")) * 100),
      imageUrl: form.get("imageUrl") || undefined,
      isActive: form.get("isActive") === "on",
      staffIds,
    };

    const isNew = editing === "new";
    const url = isNew ? "/api/services" : `/api/services/${(editing as ServiceRow).id}`;

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
    if (!confirm("Delete this service? If it has past bookings it will be deactivated instead.")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const editingRow = editing === "new" ? null : editing;

  return (
    <div>
      <button onClick={() => setEditing("new")} className="btn-primary mb-6">+ Add service</button>

      {editing && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-4 p-6">
          <h3 className="font-display text-lg text-ink">{editing === "new" ? "New service" : `Edit: ${editingRow!.name}`}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Name</label>
              <input name="name" required defaultValue={editingRow?.name} className="input-field" />
            </div>
            <div>
              <label className="label-field">Category</label>
              <select name="categoryId" required defaultValue={editingRow?.categoryId} className="input-field">
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Duration (minutes)</label>
              <input name="durationMins" type="number" min={5} required defaultValue={editingRow?.durationMins ?? 45} className="input-field" />
            </div>
            <div>
              <label className="label-field">Price (USD)</label>
              <input name="price" type="number" min={0} step="0.01" required defaultValue={editingRow ? editingRow.priceCents / 100 : ""} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Image URL (optional)</label>
              <input name="imageUrl" defaultValue={editingRow?.imageUrl ?? ""} className="input-field" placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Description</label>
              <textarea name="description" required rows={3} defaultValue={editingRow?.description} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-field">Staff who perform this service</label>
            <div className="flex flex-wrap gap-3">
              {staff.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`staff-${s.id}`} defaultChecked={editingRow?.staffIds.includes(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={editingRow?.isActive ?? true} />
            Active (visible to customers)
          </label>

          {error && <p className="border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="divide-y divide-line border-t border-line">
        {initialServices.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-ink">
                {s.name} {!s.isActive && <span className="ml-2 text-xs text-ink/40">(inactive)</span>}
              </p>
              <p className="text-sm text-ink/50">{s.categoryName} · {formatDuration(s.durationMins)} · {formatPrice(s.priceCents)}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => setEditing(s)} className="text-rosewood hover:underline">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="text-ink/50 hover:text-rosewood">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
