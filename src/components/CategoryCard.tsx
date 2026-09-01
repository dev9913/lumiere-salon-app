import Link from "next/link";

export default function CategoryCard({
  slug,
  name,
  description,
  icon,
  count,
}: {
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  count: number;
}) {
  return (
    <Link
      href={`/services/${slug}`}
      className="group card flex flex-col justify-between p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div>
        <span className="text-2xl">{icon ?? "✂️"}</span>
        <h3 className="mt-4 font-display text-lg text-ink">{name}</h3>
        {description && <p className="mt-1.5 text-sm text-ink/60">{description}</p>}
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-ink/50">{count} service{count === 1 ? "" : "s"}</span>
        <span className="font-medium text-rosewood transition group-hover:translate-x-0.5">View →</span>
      </div>
    </Link>
  );
}
