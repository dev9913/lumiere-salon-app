import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-ink text-parchment/80">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg text-parchment">Lumière Salon</p>
          <p className="mt-3 text-sm leading-relaxed">
            Considered hair, skin, and bridal care for people who notice details.
          </p>
        </div>
        <div>
          <p className="eyebrow !text-gold">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/services">All Services</Link></li>
            <li><Link href="/staff">Our Stylists</Link></li>
            <li><Link href="/book">Book an Appointment</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow !text-gold">Account</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login">Log In</Link></li>
            <li><Link href="/signup">Create Account</Link></li>
            <li><Link href="/account/bookings">Booking History</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow !text-gold">Visit</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>221 Willow Street, Portland, OR</li>
            <li>(555) 019-2244</li>
            <li>hello@lumiere-salon.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-parchment/50">
        © {new Date().getFullYear()} Lumière Salon. All rights reserved.
      </div>
    </footer>
  );
}
