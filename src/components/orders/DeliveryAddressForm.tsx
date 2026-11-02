"use client";

import { useState, type FormEvent } from "react";
import { MapPin } from "lucide-react";

export interface DeliveryAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
}

export function DeliveryAddressForm({
  onSubmit,
}: {
  onSubmit: (address: DeliveryAddress) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const address: DeliveryAddress = {
      full_name: value("full_name"),
      phone: value("phone"),
      address_line_1: value("address_line_1"),
      address_line_2: value("address_line_2") || undefined,
      city: value("city"),
      state: value("state"),
      postal_code: value("postal_code") || undefined,
      country: value("country"),
    };
    if (!address.full_name || !address.phone || !address.address_line_1 ||
        !address.city || !address.state || !address.country) {
      setError("Complete all required delivery details.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(address);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-5">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
          <MapPin size={17} className="text-[var(--color-primary)]" />
          Delivery address
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Enter where the merchant should deliver your physical items.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium">Full name *
          <input className={inputClass} name="full_name" autoComplete="name" required maxLength={120} />
        </label>
        <label className="text-xs font-medium">Phone *
          <input className={inputClass} name="phone" type="tel" autoComplete="tel" required maxLength={40} />
        </label>
        <label className="text-xs font-medium sm:col-span-2">Address *
          <input className={inputClass} name="address_line_1" autoComplete="address-line1" required maxLength={240} />
        </label>
        <label className="text-xs font-medium sm:col-span-2">Apartment, suite, etc.
          <input className={inputClass} name="address_line_2" autoComplete="address-line2" maxLength={240} />
        </label>
        <label className="text-xs font-medium">City *
          <input className={inputClass} name="city" autoComplete="address-level2" required maxLength={120} />
        </label>
        <label className="text-xs font-medium">State / region *
          <input className={inputClass} name="state" autoComplete="address-level1" required maxLength={120} />
        </label>
        <label className="text-xs font-medium">Postal code
          <input className={inputClass} name="postal_code" autoComplete="postal-code" maxLength={32} />
        </label>
        <label className="text-xs font-medium">Country *
          <input className={inputClass} name="country" autoComplete="country-name" defaultValue="Nigeria" required maxLength={120} />
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-[var(--color-danger-fg)]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {submitting ? "Creating your order…" : "Continue to payment"}
      </button>
    </form>
  );
}
