/** Join conditional class names without pulling in an extra dependency. */
export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

/** Format integer cents as a currency string, e.g. 4500 -> "$45.00" */
export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/** Format a duration in minutes as "1 hr 15 min" / "45 min" */
export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/** Format an ISO datetime for display in the visitor's local time. */
export function formatSlotLabel(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

export function formatTimeLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold border-gold/30",
  CONFIRMED: "bg-sage/15 text-sage border-sage/30",
  COMPLETED: "bg-ink/10 text-ink border-ink/20",
  CANCELLED: "bg-rosewood/10 text-rosewood border-rosewood/30",
};
