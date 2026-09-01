import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createBookingSchema,
  serviceUpsertSchema,
  scheduleUpsertSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Jordan Rivera",
      email: "jordan@example.com",
      phone: "5551234567",
      password: "supersecure1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Jordan Rivera",
      email: "jordan@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Jordan Rivera",
      email: "not-an-email",
      password: "supersecure1",
    });
    expect(result.success).toBe(false);
  });

  it("allows an omitted phone number", () => {
    const result = registerSchema.safeParse({
      name: "Jordan Rivera",
      email: "jordan@example.com",
      password: "supersecure1",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "jordan@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("createBookingSchema", () => {
  it("requires cuid-shaped service and staff ids", () => {
    const result = createBookingSchema.safeParse({
      serviceId: "not-a-cuid",
      staffId: "cljk3x9y00000qzrmn831p6t7",
      startsAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed booking request", () => {
    const result = createBookingSchema.safeParse({
      serviceId: "cljk3x9y00000qzrmn831p6t7",
      staffId: "cljk3x9y00001qzrmn831p6t8",
      startsAt: new Date().toISOString(),
      notes: "First time client",
    });
    expect(result.success).toBe(true);
  });
});

describe("serviceUpsertSchema", () => {
  it("coerces string form values into numbers", () => {
    const result = serviceUpsertSchema.safeParse({
      name: "Deep Tissue Massage",
      categoryId: "cljk3x9y00000qzrmn831p6t7",
      description: "Targeted pressure to release chronic tension.",
      durationMins: "60",
      priceCents: "10500",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationMins).toBe(60);
      expect(result.data.priceCents).toBe(10500);
    }
  });

  it("rejects a negative price", () => {
    const result = serviceUpsertSchema.safeParse({
      name: "Deep Tissue Massage",
      categoryId: "cljk3x9y00000qzrmn831p6t7",
      description: "Targeted pressure to release chronic tension.",
      durationMins: "60",
      priceCents: "-100",
    });
    expect(result.success).toBe(false);
  });
});

describe("scheduleUpsertSchema", () => {
  it("accepts a full week of entries", () => {
    const result = scheduleUpsertSchema.safeParse({
      staffId: "cljk3x9y00000qzrmn831p6t7",
      entries: [
        { dayOfWeek: 2, startMin: 540, endMin: 1020 },
        { dayOfWeek: 3, startMin: 540, endMin: 1020 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a dayOfWeek outside 0-6", () => {
    const result = scheduleUpsertSchema.safeParse({
      staffId: "cljk3x9y00000qzrmn831p6t7",
      entries: [{ dayOfWeek: 7, startMin: 540, endMin: 1020 }],
    });
    expect(result.success).toBe(false);
  });
});
