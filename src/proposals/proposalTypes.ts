import { z } from "zod";

// Proposal schema validation
const ProposalSchema = z.object({
    coverLetter: z.string().min(10, "Cover letter must be at least 10 characters."),
    estimatedTime: z.string().min(1),
    proposalType: z.enum(["fixed", "milestones"]),
    files: z.array(z.string()).optional(),
    totalPrice: z.number().positive(),
  });

  export default ProposalSchema;