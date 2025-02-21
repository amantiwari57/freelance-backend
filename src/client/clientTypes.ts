import { z } from 'zod';    

export const ClientProfileSchema = z.object({
    // userType: z.literal("client"),
    country: z.string().min(2),
    city: z.string().min(2),
    clientType: z.enum(["company", "individual"]),
    verification: z.string().optional(),
    clientImage: z.string().optional(),
    companySize: z.enum(["small", "medium", "large"]).optional(),
  });