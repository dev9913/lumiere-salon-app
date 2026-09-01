import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";

// Customer and admin sessions live in *separate* cookies. This lets the same
// browser hold an admin session and a customer session at once (e.g. an
// admin testing the booking flow as a customer in another tab) without one
// login overwriting the other.
const CUSTOMER_SESSION_COOKIE = "lumiere_customer_session";
const ADMIN_SESSION_COOKIE = "lumiere_admin_session";
const SESSION_TTL_DAYS = 30;

function cookieNameFor(role: Role) {
  return role === "ADMIN" ? ADMIN_SESSION_COOKIE : CUSTOMER_SESSION_COOKIE;
}

/** Hash a plaintext password for storage. */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/** Compare plaintext password against a stored hash. */
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new database-backed session for a user and set the HTTP-only
 * cookie for that role. The cookie itself only ever holds an opaque random
 * token — never the user id or any claims — so a session can be revoked
 * server-side at any time by deleting the row.
 */
export async function createSession(userId: string, role: Role) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  cookies().set(cookieNameFor(role), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/** Destroy the current session for the given role's cookie only. */
export async function destroySession(role: Role = "CUSTOMER") {
  const cookieName = cookieNameFor(role);
  const token = cookies().get(cookieName)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => null);
  }
  cookies().delete(cookieName);
}

async function resolveSession(cookieName: string): Promise<User | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return session.user;
}

/** Resolve the current request's *customer* session, if any. */
export async function getCurrentUser(): Promise<User | null> {
  return resolveSession(CUSTOMER_SESSION_COOKIE);
}

/** Resolve the current request's *admin* session, if any (verifies role). */
export async function getCurrentAdmin(): Promise<User | null> {
  const user = await resolveSession(ADMIN_SESSION_COOKIE);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** Throws (as a redirect-friendly null) unless the current user has `role`. */
export async function requireRole(role: Role): Promise<User | null> {
  if (role === "ADMIN") return getCurrentAdmin();
  const user = await getCurrentUser();
  return user && user.role === role ? user : null;
}
