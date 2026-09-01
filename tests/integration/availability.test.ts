import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots, createBookingWithConflictCheck, BookingConflictError } from "@/lib/availability";

// This suite talks to a real Postgres database. It runs only when
// DATABASE_URL is set (see the CI workflow, which provisions a throwaway
// Postgres service container) and is skipped locally otherwise so `npm test`
// stays fast and dependency-free for everyday development.
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("booking conflict prevention (integration)", () => {
  const runId = `test-${Date.now()}`;
  let categoryId: string;
  let serviceId: string;
  let staffId: string;
  let customerId: string;
  let bookedSlotStartsAt: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: `Test Category ${runId}`, slug: `test-category-${runId}` },
    });
    categoryId = category.id;

    const service = await prisma.service.create({
      data: {
        name: `Test Service ${runId}`,
        slug: `test-service-${runId}`,
        description: "Fixture service for integration tests.",
        durationMins: 30,
        priceCents: 5000,
        categoryId,
      },
    });
    serviceId = service.id;

    const staff = await prisma.staff.create({
      data: {
        name: `Test Stylist ${runId}`,
        slug: `test-stylist-${runId}`,
        title: "Test",
        bio: "Fixture staff member for integration tests.",
      },
    });
    staffId = staff.id;

    await prisma.staffService.create({ data: { staffId, serviceId } });

    // Wide-open hours every day so slot generation never depends on which
    // weekday the test happens to run on.
    await prisma.weeklySchedule.createMany({
      data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        staffId,
        dayOfWeek,
        startMin: 0,
        endMin: 1440,
      })),
    });

    const customer = await prisma.user.create({
      data: {
        name: `Test Customer ${runId}`,
        email: `${runId}@example.com`,
        passwordHash: "not-a-real-hash",
        role: "CUSTOMER",
      },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    // Clean up in FK-safe order. Deleting the staff/service/category cascades
    // to StaffService and WeeklySchedule via onDelete: Cascade; bookings and
    // the test user are removed explicitly first.
    await prisma.booking.deleteMany({ where: { customerId } });
    await prisma.user.delete({ where: { id: customerId } }).catch(() => null);
    await prisma.staff.delete({ where: { id: staffId } }).catch(() => null);
    await prisma.service.delete({ where: { id: serviceId } }).catch(() => null);
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => null);
    await prisma.$disconnect();
  });

  it("generates available slots matching the service duration", async () => {
    const slots = await getAvailableSlots(staffId, serviceId);
    expect(slots.length).toBeGreaterThan(0);

    const first = slots[0];
    const durationMs = new Date(first.endsAt).getTime() - new Date(first.startsAt).getTime();
    expect(durationMs).toBe(30 * 60 * 1000);
  });

  it("allows a booking to be created for an open slot, and that slot then disappears from availability", async () => {
    const slotsBefore = await getAvailableSlots(staffId, serviceId);
    const slot = slotsBefore[5];
    bookedSlotStartsAt = slot.startsAt;

    const booking = await createBookingWithConflictCheck({
      customerId,
      serviceId,
      staffId,
      startsAt: new Date(slot.startsAt),
      endsAt: new Date(slot.endsAt),
      priceCents: 5000,
    });
    expect(booking.id).toBeDefined();
    expect(booking.status).toBe("PENDING");

    const slotsAfter = await getAvailableSlots(staffId, serviceId);
    expect(slotsAfter.some((s) => s.startsAt === bookedSlotStartsAt)).toBe(false);
  });

  it("rejects a second booking that overlaps an existing one, even when fired concurrently", async () => {
    const slots = await getAvailableSlots(staffId, serviceId);
    const slot = slots[10];
    const startsAt = new Date(slot.startsAt);
    const endsAt = new Date(slot.endsAt);

    // Fire both requests for the exact same slot at the same time — this is
    // the scenario a naive "check then write" (non-transactional) approach
    // fails under, since both requests could pass the check before either
    // has written its row.
    const results = await Promise.allSettled([
      createBookingWithConflictCheck({ customerId, serviceId, staffId, startsAt, endsAt, priceCents: 5000 }),
      createBookingWithConflictCheck({ customerId, serviceId, staffId, startsAt, endsAt, priceCents: 5000 }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BookingConflictError);
  });

  it("does not resurrect a cancelled booking's slot as unavailable", async () => {
    const slots = await getAvailableSlots(staffId, serviceId);
    const slot = slots[15];

    const booking = await createBookingWithConflictCheck({
      customerId,
      serviceId,
      staffId,
      startsAt: new Date(slot.startsAt),
      endsAt: new Date(slot.endsAt),
      priceCents: 5000,
    });

    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });

    const slotsAfterCancel = await getAvailableSlots(staffId, serviceId);
    expect(slotsAfterCancel.some((s) => s.startsAt === slot.startsAt)).toBe(true);
  });
});
