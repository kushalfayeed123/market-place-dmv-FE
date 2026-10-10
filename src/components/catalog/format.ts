export function formatMoney(amount: number, currency: string): string {
  // Amounts are in minor units (kobo for NGN, cents for USD); divide by 100.
  const major = (amount ?? 0) / 100;
  try {
    // Always show 2 decimal places, then strip ".00" for whole amounts
    // so ₦1,008 renders as "₦1,008" but ₦1,008.50 keeps the cents.
    const formatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
    return formatted.replace(/\.00(?=\D|$)/, "");
  } catch {
    const formatted = major.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency} ${formatted.replace(/\.00(?=\D|$)/, "")}`;
  }
}

/** Hide the "Merchant #abcd1234" / "Store #abcd1234" placeholders App.tsx generates. */
export function cleanLabel(s?: string): string | undefined {
  if (!s) return undefined;
  return /^(Merchant|Store) #/i.test(s) ? undefined : s;
}
