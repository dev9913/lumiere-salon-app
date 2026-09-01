import { prisma } from "@/lib/prisma";

export const revalidate = 300;
export const metadata = { title: "Contact & Location — Lumière Salon" };

export default async function ContactPage() {
  const info = await prisma.salonInfo.findFirst();

  const name = info?.name ?? "Lumière Salon";
  const addressLine = info?.addressLine ?? "221 Willow Street";
  const city = info?.city ?? "Portland, OR 97205";
  const phone = info?.phone ?? "(555) 019-2244";
  const email = info?.email ?? "hello@lumiere-salon.com";
  const hoursNote = info?.hoursNote ?? "Tue–Sat 9am–7pm · Sun–Mon closed";
  const mapEmbedUrl =
    info?.mapEmbedUrl ??
    "https://www.google.com/maps?q=Portland+Oregon&output=embed";

  return (
    <div className="container-page py-16">
      <p className="eyebrow">Find us</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Visit {name}</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <dl className="space-y-6">
            <div>
              <dt className="eyebrow">Address</dt>
              <dd className="mt-1 text-ink">{addressLine}<br />{city}</dd>
            </div>
            <div>
              <dt className="eyebrow">Hours</dt>
              <dd className="mt-1 text-ink">{hoursNote}</dd>
            </div>
            <div>
              <dt className="eyebrow">Phone</dt>
              <dd className="mt-1 text-ink"><a href={`tel:${phone}`} className="hover:text-rosewood">{phone}</a></dd>
            </div>
            <div>
              <dt className="eyebrow">Email</dt>
              <dd className="mt-1 text-ink"><a href={`mailto:${email}`} className="hover:text-rosewood">{email}</a></dd>
            </div>
          </dl>

          <div className="mt-10 border-t border-line pt-6">
            <p className="eyebrow">Parking &amp; access</p>
            <p className="mt-2 text-sm text-ink/60">
              Street parking on Willow St. after 6pm, plus the public garage one block north on 5th Ave. The studio
              is wheelchair accessible via the side entrance.
            </p>
          </div>
        </div>

        <div className="aspect-[4/3] w-full overflow-hidden border border-line lg:aspect-auto">
          <iframe
            title="Salon location map"
            src={mapEmbedUrl}
            className="h-full min-h-[320px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
