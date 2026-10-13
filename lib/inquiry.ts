import { z } from "zod";

export const serviceOptions = ["Website", "Web application", "Mobile application", "B2B / custom software", "Automation", "Let's figure it out"] as const;
export const budgetOptions = ["Let's discuss", "€2k–5k", "€5k–10k", "€10k–25k", "€25k+"] as const;
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  company: z.string().trim().max(140).default(""),
  service: z.enum(serviceOptions),
  budget: z.enum(budgetOptions),
  message: z.string().trim().min(20, "Tell us a little more (at least 20 characters).").max(5000),
  consent: z.literal(true, { errorMap: () => ({ message: "Please agree so we can respond to your enquiry." }) }),
  website: z.string().max(0).optional(),
});
