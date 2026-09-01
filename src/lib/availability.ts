import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, addMinutes, isBefore, isAfter } from "date-fns";

export const BOOKING_HORIZON_DAYS = 14;
export const SLOT_GRANULARITY_MINS = 15; // slots snap to quarter-hours

export interface TimeSlot {
  /** ISO string, start of the slot in UTC */
  startsAt: string;
  /** ISO string, when this slot's appointment would end given the service duration */
  endsAt: string;
}

/**
 * Compute every bookable start time for a given staff member + service over
 * the next BOOKING_HORIZON_DAYS days, taking into account:
 *   1. the staff's recurring weekly working hours
 *   2. one-off time-off / extra-shift exceptions
 *   3. existing bookings (so nothing overlaps)
 *   4. the service's duration (a slot must have room to finish before closing)
 *
 * All returned dates are plain UTC instants — timezone display is a
 * client-side concern (Intl.DateTimeFormat with the visitor's locale).
 */
export async function getAvailableSlots(staffId: string, serviceId: string, fromDate?: Date): Promise<TimeSlot[]> {
  const [staff, service] = await Promise.all([
    prisma.staff.findUnique({
      where: { id: staffId },
      include: { schedules: true, timeOff: true },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);

  if (!staff || !service || !staff.isActive || !service.isActive) return [];

  const rangeStart = startOfDay(fromDate ?? new Date());
  const rangeEnd = addDays(rangeStart, BOOKING_HORIZON_DAYS);

  // Existing, non-cancelled bookings for this staff member in the window —
  // used to punch holes out of the raw availability windows below.
  const existingBookings = await prisma.booking.findMany({
    where: {
      staffId,
      status: { not: "CANCELLED" },
      startsAt: { gte: rangeStart, lt: rangeEnd },
    },
    select: { startsAt: true, endsAt: true },
  });

  const slots: TimeSlot[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < BOOKING_HORIZON_DAYS; dayOffset++) {
    const day = addDays(rangeStart, dayOffset);
    const dayOfWeek = day.getDay();

    // Whole-day time off cancels the day outright.
    const fullDayOff = staff.timeOff.some(
      (t) => isSameDate(t.date, day) && t.startMin == null && t.endMin == null
    );
    if (fullDayOff) continue;

    const partialOff = staff.timeOff.filter(
      (t) => isSameDate(t.date, day) && t.startMin != null && t.endMin != null
    );

    for (const schedule of staff.schedules.filter((s) => s.dayOfWeek === dayOfWeek)) {
      for (
        let minute = schedule.startMin;
        minute + service.durationMins <= schedule.endMin;
        minute += SLOT_GRANULARITY_MINS
      ) {
        const slotStart = addMinutes(day, minute);
        const slotEnd = addMinutes(slotStart, service.durationMins);

        if (isBefore(slotStart, now)) continue; // no booking slots in the past

        const blockedByTimeOff = partialOff.some((t) => {
          const offStart = addMinutes(day, t.startMin!);
          const offEnd = addMinutes(day, t.endMin!);
          return overlaps(slotStart, slotEnd, offStart, offEnd);
        });
        if (blockedByTimeOff) continue;

        const blockedByBooking = existingBookings.some((b) =>
          overlaps(slotStart, slotEnd, b.startsAt, b.endsAt)
        );
        if (blockedByBooking) continue;

        slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
      }
    }
  }

  return slots;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export class BookingConflictError extends Error {
  constructor() {
    super("This time slot was just taken. Please choose another time.");
    this.name = "BookingConflictError";
  }
}

/**
 * Atomically create a booking, re-validating on the database that no
 * overlapping booking exists for this staff member. Runs inside a
 * serializable transaction so two simultaneous requests for the same slot
 * cannot both succeed (the loser gets BookingConflictError and the client
 * should re-fetch availability).
 */
export async function createBookingWithConflictCheck(params: {
  customerId: string;
  serviceId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  notes?: string;
  rescheduledFromId?: string;
}) {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const conflict = await tx.booking.findFirst({
            where: {
              staffId: params.staffId,
              status: { not: "CANCELLED" },
              startsAt: { lt: params.endsAt },
              endsAt: { gt: params.startsAt },
            },
          });

          if (conflict) throw new BookingConflictError();

          const booking = await tx.booking.create({
            data: {
              customerId: params.customerId,
              serviceId: params.serviceId,
              staffId: params.staffId,
              startsAt: params.startsAt,
              endsAt: params.endsAt,
              priceCents: params.priceCents,
              notes: params.notes,
              rescheduledFromId: params.rescheduledFromId,
              status: "PENDING",
            },
          });

          if (params.rescheduledFromId) {
            await tx.booking.update({
              where: { id: params.rescheduledFromId },
              data: { status: "CANCELLED" },
            });
          }

          return booking;
        },
        { isolationLevel: "Serializable" }
      );
    } catch (err) {
      // A genuine conflict our own check found — never retry this, it's the
      // real answer.
      if (err instanceof BookingConflictError) throw err;

      // Postgres's own serializable-isolation guard can abort one of two
      // truly concurrent transactions with its own error (P2034) *before*
      // our findFirst check even runs — this is Postgres protecting
      // correctness at a layer below our application check. It doesn't
      // necessarily mean the slot is taken, just that this attempt collided
      // with another one; retrying lets the check run cleanly against
      // whatever committed first.
      if (isSerializationFailure(err) && attempt < MAX_ATTEMPTS) {
        continue;
      }
      if (isSerializationFailure(err)) {
        // Out of retries while under contention — safest to report this as
        // a conflict rather than surface a raw database error to the caller.
        throw new BookingConflictError();
      }
      throw err;
    }
  }

  // Unreachable, but keeps TypeScript happy about the return type.
  throw new BookingConflictError();
}

function isSerializationFailure(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2034"
  );
}
