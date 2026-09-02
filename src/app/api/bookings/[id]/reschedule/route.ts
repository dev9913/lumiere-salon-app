import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rescheduleBookingSchema } from "@/lib/validation";
import {
  BookingConflictError,
  createBookingWithConflictCheck,
} from "@/lib/availability";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { service: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.customerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
    return NextResponse.json(
      { error: "This booking can no longer be rescheduled." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = rescheduleBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Invalid input",
      },
      { status: 400 }
    );
  }

  const startsAt = new Date(parsed.data.startsAt);

  if (startsAt < new Date()) {
    return NextResponse.json(
      { error: "You can't reschedule to a time in the past." },
      { status: 400 }
    );
  }

  const endsAt = addMinutes(
    startsAt,
    existing.service.durationMins
  );

  try {
    const booking = await createBookingWithConflictCheck({
      customerId: existing.customerId,
      serviceId: existing.serviceId,
      staffId: existing.staffId,
      startsAt,
      endsAt,
      priceCents: existing.priceCents,
      notes: existing.notes ?? undefined,
      rescheduledFromId: existing.id,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json(
        { error: err.message },
        { status: 409 }
      );
    }

    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong rescheduling your booking." },
      { status: 500 }
    );
  }
}
