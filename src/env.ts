import { z } from "zod";

/**
 * Typed environment configuration.
 * Mirrors the recovered original `src/env.ts` (NEXT_PUBLIC_* / process.env —
 * the app targets Next.js, where process.env is inlined at build time).
 * Fails loudly at startup if a required var is missing or malformed.
 */
const envSchema = z.object({
  NEXT_PUBLIC_AGENT_GATEWAY_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().startsWith("pk_"),
  NEXT_PUBLIC_ENABLE_AGENT: z
    .string()
    .transform((val) => val === "true"),
  NEXT_PUBLIC_ENABLE_DEBUG: z
    .string()
    .transform((val) => val === "true"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_AGENT_GATEWAY_URL:
    process.env.NEXT_PUBLIC_AGENT_GATEWAY_URL ?? "",
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY:
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
  NEXT_PUBLIC_ENABLE_AGENT: process.env.NEXT_PUBLIC_ENABLE_AGENT ?? "false",
  NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG ?? "false",
});
