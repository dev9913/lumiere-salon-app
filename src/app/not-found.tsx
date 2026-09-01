import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Page not found</h1>
      <p className="mt-3 text-ink/60">The page you're looking for doesn't exist or has moved.</p>
      <Link href="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
