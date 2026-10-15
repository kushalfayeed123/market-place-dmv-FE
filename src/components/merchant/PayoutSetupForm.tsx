"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Landmark, Loader2, Plus } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import type { PayoutAccountCreate } from "@/lib/api/client";

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

const payoutSchema = z.object({
  provider: z.enum(["paystack", "flutterwave", "stripe"], {
    errorMap: () => ({ message: "Please select a payout provider" }),
  }),
  currency: z.string().length(3, "Currency code must be 3 letters"),
  external_ref: z.string().min(1, "Account reference is required"),
  account_last4: z.string().optional(),
  bank_name: z.string().optional(),
  account_holder_name: z.string().optional(),
  bank_code: z.string().optional(),
  routing_number: z.string().optional(),
  account_type: z.enum(["checking", "savings"]).optional(),
    country: z.string().length(2, "Country is required"),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

interface PayoutSetupFormProps {
    merchantId: string;
  onSuccess?: () => void;
}

export function PayoutSetupForm({ merchantId, onSuccess }: PayoutSetupFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { provider: "paystack", currency: "NGN", country: "NG" },
  });

  async function onSubmit(data: PayoutFormData) {
    setSubmitting(true); setError(null);
    try {
      await apiClient.createPayoutAccount(merchantId, {
        provider: data.provider, currency: data.currency, external_ref: data.external_ref,
        account_last4: data.account_last4 || undefined,
        bank_name: data.bank_name || undefined,
        account_holder_name: data.account_holder_name || undefined,
        bank_code: data.bank_code || undefined,
        routing_number: data.routing_number || undefined,
        account_type: data.account_type || undefined,
        country: data.country,
      });
      onSuccess?.();
    } catch (e) {
      setError(e instanceof ApiError ? (e.message || "Could not save payout account.") : "An unexpected error occurred.");
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
        Add a bank account so you can receive funds from sales.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payout provider</label>
            <select {...register("provider")} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select a provider</option>
              <option value="paystack">Paystack</option>
              <option value="flutterwave">Flutterwave</option>
              <option value="stripe">Stripe</option>
            </select>
            {errors.provider && <p className="mt-1 text-xs text-red-600">{errors.provider.message}</p>}
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account reference</label>
          <input type="text" placeholder="Paystack subaccount code or bank account number"
            {...register("external_ref")}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          {errors.external_ref && <p className="mt-1 text-xs text-red-600">{errors.external_ref.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
            <select {...register("country")} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select a country</option>
              {COUNTRY_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account holder name</label>
            <input type="text" placeholder="As it appears on the bank account"
              {...register("account_holder_name")}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[var(--color-primary)] hover:underline">
            {showAdvanced ? "Hide" : "Show"} additional bank details
          </button>
        </div>
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank name</label>
              <input type="text" placeholder="e.g. First Bank" {...register("bank_name")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account last 4</label>
              <input type="text" maxLength={4} placeholder="1234" {...register("account_last4")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank code</label>
              <input type="text" placeholder="e.g. 011" {...register("bank_code")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account type</label>
              <select {...register("account_type")} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Default</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>
        )}
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