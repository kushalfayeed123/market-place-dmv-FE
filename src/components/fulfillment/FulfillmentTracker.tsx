import { Package, CheckCircle, Truck, MapPin, Clock } from "lucide-react";

const steps = [
  { key: "confirmed", label: "Order Confirmed", icon: <CheckCircle size={16} /> },
  { key: "packed", label: "Packed", icon: <Package size={16} /> },
  { key: "in_transit", label: "In Transit", icon: <Truck size={16} /> },
  { key: "out_for_delivery", label: "Out for Delivery", icon: <MapPin size={16} /> },
  { key: "delivered", label: "Delivered", icon: <CheckCircle size={16} /> },
];

const orderStepIndex: Record<string, number> = {
  processing: 0,
  packed: 1,
  in_transit: 2,
  out_for_delivery: 3,
  delivered: 4,
};

export function FulfillmentTracker({ order }: { order: { id: string; order_number: string; status: string; merchant_name: string } }) {
  const currentStep = orderStepIndex[order.status] ?? 0;

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Truck size={16} className="text-[var(--color-primary)]" /> Order Tracking
        </h3>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">{order.order_number} · {order.merchant_name}</p>
      </div>

      <div className="px-6 py-6">
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--color-border)]" />
          <div
            className="absolute top-4 left-4 h-0.5 bg-[var(--color-primary)] transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          <div className="relative flex justify-between">
            {steps.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2 w-16">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${done ? "bg-[var(--color-primary)] text-white" : "bg-white border-2 border-[var(--color-border)] text-[var(--color-muted)]"} ${active ? "ring-4 ring-[var(--color-primary)]/20" : ""}`}>
                    {step.icon}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${done ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {order.status === "in_transit" && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-center gap-3">
            <Clock size={16} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">Estimated delivery: Dec 5, 2024</p>
              <p className="text-xs text-[var(--color-muted)]">Your package is on its way via GIG Logistics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
