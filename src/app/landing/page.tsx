import { LandingPage } from "@/components/landing/LandingPage";

// Force dynamic rendering so the page never hangs during static generation.
export const dynamic = "force-dynamic";

/**
 * Marketing landing page — kept for marketing purposes alone.
 * The product listing page is the app entry point at "/".
 */
export default function LandingRoute() {
  return (
    <LandingPage
      onEnter={() => {
        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }
      }}
    />
  );
}
