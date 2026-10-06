"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Loader2, MapPin } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const onboardSchema = z.object({
  business_name: z
    .string()
    .min(1, "Business name is required")
    .max(255, "Business name is too long"),
  slug: z
    .string()
    .min(1, "Store slug is required")
    .max(255)
    .regex(
      SLUG_REGEX,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

export type OnboardFormData = z.infer<typeof onboardSchema>;

export interface MerchantSetupFormProps {
  onSuccess: () => void;
}

/**
 * Derives a URL-safe slug from a business name:
 *  - lowercased
 *  - non-alphanumeric runs collapsed to single hyphens
 *  - trimmed
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MerchantSetupForm({ onSuccess }: MerchantSetupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardFormData>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      business_name: "",
      slug: "",
    },
  });

  const businessName = watch("business_name");

  // Auto-derive slug when business_name changes and the user hasn't
  // manually edited the slug field yet.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (!slugManuallyEdited && businessName) {
      setValue("slug", slugify(businessName));
    }
  }, [businessName, slugManuallyEdited, setValue]);

  const onSubmit = async (data: OnboardFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.onboardMerchant(data);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to set up your store",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
          Set up your store
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          Welcome! Before you can start selling, you need to create your
          merchant profile. This can be updated later in your settings.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Business name */}
        <div>
          <label
            htmlFor="business_name"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Business name
          </label>
          <input
            id="business_name"
            type="text"
            autoComplete="organization"
            {...register("business_name")}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g. Uncle Seg's Tech Gadgets"
          />
          {errors.business_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.business_name.message}
            </p>
          )}
        </div>

        {/* Store slug */}
        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Store slug
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              yourstore.marketplace.com/
            </span>
            <input
              id="slug"
              type="text"
              autoComplete="off"
              {...register("slug")}
              onChange={(e) => {
                register("slug").onChange(e);
                if (!slugManuallyEdited) {
                  setSlugManuallyEdited(true);
                }
              }}
              className="w-full pl-[210px] pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="store-slug"
            />
          </div>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">
              {errors.slug.message}
            </p>
          )}
        </div>

        {/* Address section */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)] mb-3">
            <MapPin size={16} />
            <span>Billing address (optional)</span>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="address_line1"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Address line 1
              </label>
              <input
                id="address_line1"
                type="text"
                autoComplete="address-line1"
                {...register("address_line1")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label
                htmlFor="address_line2"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Address line 2
              </label>
              <input
                id="address_line2"
                type="text"
                autoComplete="address-line2"
                {...register("address_line2")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  {...register("city")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="City"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  State / Province
                </label>
                <input
                  id="state"
                  type="text"
                  autoComplete="address-level1"
                  {...register("state")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label
                  htmlFor="postal_code"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Postal code
                </label>
                <input
                  id="postal_code"
                  type="text"
                  autoComplete="postal-code"
                  {...register("postal_code")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="12345"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  autoComplete="country-name"
                  {...register("country")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. NG, US"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Setting up your store…</span>
            </>
          ) : (
            <>
              <Store size={16} />
              <span>Create my store</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

