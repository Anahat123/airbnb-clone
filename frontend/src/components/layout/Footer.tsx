import { Globe } from "lucide-react";
import Link from "next/link";

const COLUMNS = [
  { title: "Support", links: ["Help Centre", "Get help with a safety issue", "AirCover", "Anti-discrimination", "Disability support", "Cancellation options", "Report neighbourhood concern"] },
  { title: "Hosting", links: ["Airbnb your home", "Airbnb your experience", "Airbnb your service", "AirCover for Hosts", "Hosting resources", "Community forum", "Hosting responsibly"] },
  { title: "Airbnb", links: ["2026 Summer Release", "Newsroom", "Careers", "Investors", "Airbnb.org emergency stays"] },
];

/** `flush` removes the top gap and border, when a grey section (e.g. Inspiration) sits directly above. */
export function Footer({ flush = false }: { flush?: boolean }) {
  return (
    <footer className={`bg-bg-secondary pb-24 md:pb-0 ${flush ? "" : "mt-16 border-t border-line-light"}`}>
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 xl:px-12">
        <div className="grid gap-8 border-b border-line-light py-12 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold">{col.title}</h3>
              <ul className="space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href="/help" className="hover:underline">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col-reverse gap-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-fg-secondary">
            © 2026 Airbnb clone · Built for a fullstack assignment, not affiliated with Airbnb, Inc. · Privacy · Terms
          </p>
          <div className="flex items-center gap-6 font-semibold">
            <span className="flex items-center gap-2">
              <Globe size={16} /> English (IN)
            </span>
            <span>₹ INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
