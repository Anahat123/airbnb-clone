import { money, plural } from "@/lib/format";

interface Breakdown {
  nights: number;
  nightly_rate: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total: number;
}

/** "₹18,500 x 3 nights / Cleaning fee / Airbnb service fee / Taxes / Total". */
export function PriceBreakdown({ q, totalLabel = "Total" }: { q: Breakdown; totalLabel?: string }) {
  const rows: [string, number][] = [
    [`${money(q.nightly_rate)} x ${plural(q.nights, "night")}`, q.nightly_rate * q.nights],
    ...(q.cleaning_fee ? ([["Cleaning fee", q.cleaning_fee]] as [string, number][]) : []),
    ["Airbnb service fee", q.service_fee],
    ["Taxes", q.taxes],
  ];
  return (
    <div className="text-[15px]">
      <div className="space-y-3">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between">
            <span className="underline decoration-1 underline-offset-2">{label}</span>
            <span>{money(amount)}</span>
          </div>
        ))}
      </div>
      <hr className="my-5 border-line-light" />
      <div className="flex justify-between font-semibold">
        <span>{totalLabel}</span>
        <span>{money(q.total)}</span>
      </div>
    </div>
  );
}
