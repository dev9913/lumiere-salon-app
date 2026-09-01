import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getCurrentAdmin } from "@/lib/auth";
import { createBookingSchema } from "@/lib/validation";
import { BookingConflictError, createBookingWithConflictCheck } from "@/lib/availability";
import { addMinutes } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const scope = searchParams.get("scope"); // "all" (admin only) or omitted for "mine"

  if (scope === "all") {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      where: status ? { status: status as any } : {},
      include: { service: { include: { category: true } }, staff: true, customer: true },
      orderBy: { startsAt: "desc" },
    });
    return NextResponse.json(bookings);
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.id, ...(status ? { status: status as any } : {}) },
    include: { service: { include: { category: true } }, staff: true, customer: true },
    orderBy: { startsAt: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to book an appointment." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId } });
  if (!service || !service.isActive) {
    return NextResponse.json({ error: "This service is not currently available." }, { status: 404 });
  }

  const staffOffersService = await prisma.staffService.findUnique({
    where: { staffId_serviceId: { staffId: parsed.data.staffId, serviceId: parsed.data.serviceId } },
  });
  if (!staffOffersService) {
    return NextResponse.json({ error: "This stylist does not offer that service." }, { status: 400 });
  }

  const startsAt = new Date(parsed.data.startsAt);
  if (startsAt < new Date()) {
    return NextResponse.json({ error: "You can't book a time in the past." }, { status: 400 });
  }
  const endsAt = addMinutes(startsAt, service.durationMins);

  try {
    const booking = await createBookingWithConflictCheck({
      customerId: user.id,
      serviceId: service.id,
      staffId: parsed.data.staffId,
      startsAt,
      endsAt,
      priceCents: service.priceCents,
      notes: parsed.data.notes,
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong creating your booking." }, { status: 500 });
  }
}
