import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import MobileNav from "@/components/MobileNav";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/staff", label: "Stylists" },
  { href: "/contact", label: "Visit" },
];

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-parchment/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-wide text-ink">
          Lumière <span className="text-rosewood">Salon</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-ink/70 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link href="/account" className="text-sm font-medium text-ink/70 hover:text-ink">
              {user.name.split(" ")[0]}&rsquo;s Account
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-medium text-ink/70 hover:text-ink">
              Log in
            </Link>
          )}
          <Link href="/book" className="btn-primary !px-5 !py-2.5 text-sm">
            Book Now
          </Link>
        </div>

        <MobileNav links={NAV_LINKS} isLoggedIn={!!user} />
      </div>
    </header>
  );
}
