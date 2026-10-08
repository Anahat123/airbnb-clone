import { Tag } from "lucide-react";

/** Floating note shown on airbnb.co.in: card prices are all-in. */
export function PricesIncludeFees() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[700] hidden justify-center md:flex">
      <span className="flex items-center gap-2 rounded-full bg-bg-elevated px-5 py-3 text-sm font-medium shadow-pop">
        <Tag size={16} className="fill-rausch text-rausch" /> Prices include all fees
      </span>
    </div>
  );
}
