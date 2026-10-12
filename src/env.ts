import { z } from "zod";

/**
 * Typed environment configuration.
 * Mirrors the recovered original `src/env.ts` (* / process.env —
 * the app targets Next.js, where process.env is inlined at build time).
 * Fails loudly at startup if a required var is missing or malformed.
 */
const envSchema = z.object({
  AGENT_GATEWAY_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  PAYSTACK_PUBLIC_KEY: z.string().startsWith("pk_"),
  ENABLE_AGENT: z
    .string()
    .transform((val) => val === "true"),
  ENABLE_DEBUG: z
    .string()
    .transform((val) => val === "true"),
});

export const env = envSchema.parse({
  AGENT_GATEWAY_URL:
    process.env.AGENT_GATEWAY_URL ?? "",
  API_BASE_URL: process.env.API_BASE_URL ?? "",
  PAYSTACK_PUBLIC_KEY:
    process.env.PAYSTACK_PUBLIC_KEY ?? "",
  ENABLE_AGENT: process.env.ENABLE_AGENT ?? "false",
  ENABLE_DEBUG: process.env.ENABLE_DEBUG ?? "false",
});
