import Link from "next/link";
import Image from "next/image";

export default function StaffCard({
  slug,
  name,
  title,
  bio,
  photoUrl,
}: {
  slug: string;
  name: string;
  title: string;
  bio: string;
  photoUrl?: string | null;
}) {
  return (
    <Link href={`/staff/${slug}`} className="card group block overflow-hidden">
      <div className="relative aspect-[4/5] w-full bg-blush">
        {photoUrl && (
          <Image src={photoUrl} alt={name} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
        )}
      </div>
      <div className="p-5">
        <h4 className="font-display text-base text-ink group-hover:text-rosewood">{name}</h4>
        <p className="eyebrow mt-0.5">{title}</p>
        <p className="mt-2 line-clamp-2 text-sm text-ink/60">{bio}</p>
      </div>
    </Link>
  );
}
