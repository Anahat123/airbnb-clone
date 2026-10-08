import Link from "next/link";

/**
 * Original logo mark (a rounded location-pin loop) in Airbnb's Rausch colour.
 * We deliberately don't copy Airbnb's trademarked Bélo symbol.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="Home" className="flex items-center gap-1 text-rausch">
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.6} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 28c-2.6-3.2-9.5-10.4-9.5-15.2A9.5 9.5 0 0 1 16 3.3a9.5 9.5 0 0 1 9.5 9.5C25.5 17.6 18.6 24.8 16 28Z"
        />
        <circle cx="16" cy="12.8" r="3.6" />
      </svg>
      {!compact && <span className="hidden text-[22px] font-bold tracking-tight lg:inline">airbnb</span>}
    </Link>
  );
}
