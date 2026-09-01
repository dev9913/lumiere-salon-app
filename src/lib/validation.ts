import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createBookingSchema = z.object({
  serviceId: z.string().cuid(),
  staffId: z.string().cuid(),
  startsAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  startsAt: z.string().datetime(),
});

export const serviceUpsertSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().cuid(),
  description: z.string().min(5),
  durationMins: z.coerce.number().int().min(5).max(600),
  priceCents: z.coerce.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.coerce.boolean().optional(),
  staffIds: z.array(z.string().cuid()).optional(),
});

export const categoryUpsertSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional(),
});

export const staffUpsertSchema = z.object({
  name: z.string().min(2),
  title: z.string().min(2),
  bio: z.string().min(5),
  photoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.coerce.boolean().optional(),
  serviceIds: z.array(z.string().cuid()).optional(),
});

export const scheduleUpsertSchema = z.object({
  staffId: z.string().cuid(),
  entries: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startMin: z.number().int().min(0).max(1439),
      endMin: z.number().int().min(1).max(1440),
    })
  ),
});

export const timeOffSchema = z.object({
  staffId: z.string().cuid(),
  date: z.string(), // yyyy-mm-dd
  startMin: z.number().int().min(0).max(1439).nullable().optional(),
  endMin: z.number().int().min(1).max(1440).nullable().optional(),
  reason: z.string().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
