"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Landmark, Loader2, Plus } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import type { BankInfo, PayoutAccountCreate } from "@/lib/api/client";

const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "NG", name: "Nigeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "KE", name: "Kenya" },
];

// Bank details only — the platform picks the payout provider per currency.
// The account holder name is NOT entered here: it is returned by the
// provider's account verification (resolve-account) based on the account
// number, and shown read-only below the account number field.
const payoutSchema = z.object({
  currency: z.string().length(3, "Currency code must be 3 letters"),
  country: z.string().length(2, "Country is required"),
  bank_code: z.string().min(1, "Please select your bank"),
  bank_name: z.string().optional(),
  account_number: z.string().min(10, "Enter a valid account number"),
  account_type: z.enum(["checking", "savings"]).optional(),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

interface PayoutSetupFormProps {
  merchantId: string;
  onSuccess?: () => void;
}

export function PayoutSetupForm({ merchantId, onSuccess }: PayoutSetupFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<BankInfo[]>([]);
  // Account name returned by provider verification — never typed by the user.
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { currency: "NGN", country: "NG" },
  });

  const country = watch("country");
  const currency = watch("currency");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .listBanks(country || "NG", currency || "NGN")
      .then((data) => { if (!cancelled) setBanks(data); })
      .catch(() => { if (!cancelled) setBanks([]); });
    return () => { cancelled = true; };
  }, [country, currency]);

  async function onSubmit(data: PayoutFormData) {
    setSubmitting(true); setError(null);
    try {
      const bank = banks.find((b) => b.code === data.bank_code);
        // Verify the account FIRST so the name is resolved by the provider
        // (shown to the user) before the account is saved.
        setVerifying(true); setVerifyError(null); setResolvedName(null);
        try {
          const resolved = await apiClient.resolveBankAccount(data.account_number, data.bank_code);
          setResolvedName(resolved.account_name);
        } catch (e) {
          setVerifyError(e instanceof ApiError ? e.message : "Could not verify bank account. Check the bank and account number.");
          setSubmitting(false); setVerifying(false);
          return;
        } finally {
          setVerifying(false);
        }
      const payload: PayoutAccountCreate = {
        currency: data.currency.toUpperCase(),
        country: data.country,
        bank_code: data.bank_code,
        bank_name: bank?.name ?? data.bank_name ?? null,
        account_number: data.account_number,
          // account_holder_name is NOT sent — the platform resolves it from
          // the provider's verification response.
        account_type: data.account_type ?? null,
      };
      await apiClient.createPayoutAccount(merchantId, payload);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof ApiError ? (e.message || "Could not save payout account.") : "An unexpected error occurred.");
        console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-xl border border-[var(--color-border)] bg-white p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <Landmark size={20} />
        Set up your payout account
      </h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Add the bank account where you want to receive payouts. Your account is
        validated and registered with our payment provider automatically.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
            <select {...register("country")} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {COUNTRY_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input type="text" maxLength={3} placeholder="NGN"
              {...register("currency")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase outline-none" />
            {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank</label>
          <select
            {...register("bank_code", {
              onChange: (e) => {
                const bank = banks.find((b) => b.code === e.target.value);
                if (bank) setValue("bank_name", bank.name);
              },
            })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select your bank</option>
            {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          {errors.bank_code && <p className="mt-1 text-xs text-red-600">{errors.bank_code.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account number</label>
          <input type="text" inputMode="numeric" placeholder="10-digit account number"
            {...register("account_number")}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          {errors.account_number && <p className="mt-1 text-xs text-red-600">{errors.account_number.message}</p>}
                  {/* Account name is auto-detected from the account number — not entered. */}
                  {verifying && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                      <Loader2 size={12} className="animate-spin" /> Verifying account…
                    </p>
                  )}
                  {resolvedName && (
                    <p className="mt-1 text-xs text-green-700">
                      Account name: <b>{resolvedName}</b> (verified)
                    </p>
                  )}
                  {verifyError && <p className="mt-1 text-xs text-red-600">{verifyError}</p>}
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Account type</label>
                  <select {...register("account_type")} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Default</option>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>}
        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> <span>Saving payout account…</span></>
          ) : (
            <><Plus size={16} /> <span>Save payout account</span></>
          )}
        </button>
      </form>
    </div>
  );
}
