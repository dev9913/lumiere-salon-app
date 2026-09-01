"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  serviceCount: number;
};

export default function CategoryManager({ initial }: { initial: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editingRow = editing === "new" ? null : editing;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description") || undefined,
      icon: form.get("icon") || undefined,
      sortOrder: Number(form.get("sortOrder") || 0),
    };
    const isNew = editing === "new";
    const url = isNew ? "/api/categories" : `/api/categories/${(editing as CategoryRow).id}`;
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
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Couldn't delete this category.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button onClick={() => setEditing("new")} className="btn-primary mb-6">+ Add category</button>

      {editing && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-4 p-6">
          <h3 className="font-display text-lg text-ink">{editing === "new" ? "New category" : `Edit: ${editingRow!.name}`}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label-field">Name</label>
              <input name="name" required defaultValue={editingRow?.name} className="input-field" />
            </div>
            <div>
              <label className="label-field">Icon (emoji)</label>
              <input name="icon" defaultValue={editingRow?.icon ?? ""} className="input-field" placeholder="✂️" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Description</label>
              <input name="description" defaultValue={editingRow?.description ?? ""} className="input-field" />
            </div>
            <div>
              <label className="label-field">Sort order</label>
              <input name="sortOrder" type="number" defaultValue={editingRow?.sortOrder ?? 0} className="input-field" />
            </div>
          </div>
          {error && <p className="border border-rosewood/30 bg-rosewood/5 px-3 py-2 text-sm text-rosewood">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="divide-y divide-line border-t border-line">
        {initial.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-ink">{c.icon} {c.name}</p>
              <p className="text-sm text-ink/50">{c.serviceCount} service{c.serviceCount === 1 ? "" : "s"}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => setEditing(c)} className="text-rosewood hover:underline">Edit</button>
              <button onClick={() => handleDelete(c.id)} className="text-ink/50 hover:text-rosewood">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
