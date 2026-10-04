"use client";

import { LandingPage } from "@/components/landing/LandingPage";

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
