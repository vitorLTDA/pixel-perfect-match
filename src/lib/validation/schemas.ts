import { z } from "zod";
import { CATEGORIES } from "@/types";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "You need to accept the terms" }) }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export const forgotSchema = z.object({ email: z.string().trim().email("Enter a valid email") });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  bio: z.string().trim().max(500, "Keep it under 500 characters"),
  city: z.string().trim().min(2, "Enter your city").max(80),
  area: z.string().trim().min(2, "Enter your neighborhood").max(80),
  skills: z.string().max(300),
  phone: z.string().trim().max(30).optional(),
});

export const gigSchema = z.object({
  title: z.string().trim().min(5, "At least 5 characters").max(100),
  description: z.string().trim().min(20, "Describe the job in at least 20 characters").max(2000),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Choose a category" }) }),
  type: z.enum(["personal", "business"]),
  price: z.coerce.number({ invalid_type_error: "Enter a price" }).min(5, "Minimum €5").max(2000, "Maximum €2000"),
  durationHours: z.coerce.number().min(0.5, "At least 30 minutes").max(12, "Max 12 hours"),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a start time"),
  city: z.string().trim().min(2, "Enter the city").max(80),
  area: z.string().trim().min(2, "Enter the neighborhood").max(80),
  street: z.string().trim().min(3, "Enter the street address").max(200),
  complement: z.string().trim().max(300).optional(),
});
export type GigFormValues = z.infer<typeof gigSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().trim().max(1000).optional(),
});
