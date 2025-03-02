// helper/zodSchemas.ts

import { z } from "zod";

// Profile Schema Validation
export const profileSchema = z.object({
  jobTitle: z.string().optional(),
  profileDescription: z.string().optional(),
  cityName: z.string().optional(),
  address: z.string().optional(),
  hourlyRate: z.number().optional(),
  country: z.string().optional(),
  zipcode: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

// Portfolio Schema Validation
export const portfolioSchema = z.object({
  image: z.string().url(),
  projectLink: z.string().url(),
});

// Education Schema Validation
export const educationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  graduationYear: z.number().min(1900).max(new Date().getFullYear()),
});

// Experience Schema Validation
export const experienceSchema = z.object({
  companyName: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string(),
});

// Universal validation for PUT and POST requests

export const universalValidation = (schema: z.ZodSchema) => {
  return async (c: any, next: () => Promise<void>) => {
    try {
      const body = await c.req.json(); // Extract request body
      await schema.parseAsync(body); // Validate the body against the schema
      await next(); // If validation passes, proceed to the next handler
    } catch (error: any) {
      // If validation fails, return an error response with details
      return c.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
  };
};

