"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MobileSearch } from "@/components/search/MobileSearch";
import { SearchBar } from "@/components/search/SearchBar";
import { parseDay } from "@/lib/format";
import { guestLabel, readSearch } from "@/lib/search";

import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

const TABS = [
  { href: "/", label: "All", emoji: "🌍", match: (p: string) => p === "/" },
  { href: "/homes", label: "Homes", emoji: "🏡", match: (p: string) => p.startsWith("/homes") || p.startsWith("/s") },
  { href: "/experiences", label: "Experiences", emoji: "🎈", match: (p: string) => p.startsWith("/experiences") },
  { href: "/services", label: "Services", emoji: "🛎️", match: (p: string) => p.startsWith("/services") },
];

/**
 * variant="expanded": home page header with tabs and the big search bar; it shrinks
 *   to the compact pill once the page scrolls, like airbnb.co.in.
 * variant="compact": always the small pill; clicking it opens the big bar.
 * variant="minimal": logo and menu only (checkout, hosting pages).
 */
export function Header({
  variant = "compact",
  sticky = true,
  wide = false,
}: {
  variant?: "expanded" | "compact" | "minimal";
  sticky?: boolean;
  wide?: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const search = useMemo(() => readSearch(params), [params]);
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (variant !== "expanded") return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  // Collapse the expanded overlay whenever the route changes (React's "adjust state on prop change" pattern).
  const routeKey = `${pathname}?${params}`;
  const [lastRoute, setLastRoute] = useState(routeKey);
  if (routeKey !== lastRoute) {
    setLastRoute(routeKey);
    setExpanded(false);
  }

  const big = variant === "expanded" ? !scrolled || expanded : expanded;
  // The search page continues the header's grey band into its filter bar.
  const explore = pathname === "/" || pathname === "/homes";
  const banded = (variant === "compact" && pathname === "/s" && !expanded) || (variant === "expanded" && !big);
  const hosting = pathname.startsWith("/host");

  const checkIn = parseDay(search.checkIn);
  const checkOut = parseDay(search.checkOut);
  const when = checkIn && checkOut ? `${format(checkIn, "d MMM")} – ${format(checkOut, "d MMM")}` : explore ? "Anytime" : "Any week";
  const where = search.location ? search.location.split(",")[0] : "Anywhere";

  return (
    <>
      {expanded && variant !== "minimal" && (
        <div className="animate-fade-in fixed inset-0 z-[900] hidden bg-black/25 md:block" onClick={() => setExpanded(false)} />
      )}
      <header
        className={clsx(
          "z-[1000] w-full transition-[height]",
          banded ? "band-top" : "border-b border-line-light bg-bg",
          sticky ? "sticky top-0" : "relative",
          big && variant !== "minimal" ? "md:bg-gradient-to-b md:from-bg md:to-bg-secondary md:pb-8" : "",
        )}
      >
        <div className={clsx("mx-auto flex h-20 items-center md:h-24 justify-between gap-4 px-6 md:px-10 xl:px-12", !wide && variant === "minimal" && "max-w-[1280px]")}>
          <div className="hidden flex-1 md:flex">
            <Logo />
          </div>

          {/* Mobile: one "Start your search" pill */}
          {variant !== "minimal" && (
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-14 flex-1 items-center justify-center gap-3 rounded-full border border-line bg-bg-elevated text-sm font-semibold shadow-search md:hidden"
            >
              <Search size={16} strokeWidth={2.5} />
              {search.location || search.checkIn ? (
                <span className="truncate">
                  {where} · {when}
                </span>
              ) : (
                "Start your search"
              )}
            </button>
          )}
          {variant === "minimal" && (
            <div className="md:hidden">
              <Logo compact />
            </div>
          )}

          {/* Desktop centre: tabs (expanded) or compact pill */}
          {variant !== "minimal" && (
            <div className="hidden md:block">
              {big ? (
                <nav className="flex items-center gap-2" aria-label="Search categories">
                  {TABS.map((t) => (
                    <Link
                      key={t.label}
                      href={t.href}
                      className={clsx(
                        "group relative flex h-14 items-center gap-2 px-3 text-sm",
                        t.match(pathname) ? "font-semibold text-fg" : "text-fg-secondary hover:text-fg",
                      )}
                    >
                      <span className="text-[40px] leading-none transition-transform group-hover:scale-110">{t.emoji}</span>
                      {t.label}
                      {t.match(pathname) && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-fg" />}
                    </Link>
                  ))}
                </nav>
              ) : (
                <button
                  onClick={() => setExpanded(true)}
                  className="flex h-12 items-center rounded-full border border-line bg-bg-elevated pl-2 pr-2 text-sm shadow-search transition hover:shadow-card"
                >
                  <span className="flex items-center gap-2 px-3 font-medium">
                    <span className="text-xl leading-none">🏡</span>
                    {search.location ? `Homes in ${where}` : explore ? "Anywhere" : "Homes nearby"}
                  </span>
                  <span className="h-6 w-px bg-line" />
                  <span className={clsx("px-4 font-medium", !checkIn && "text-fg")}>{when}</span>
                  <span className="h-6 w-px bg-line" />
                  <span className={clsx("px-4", search.adults || explore ? "font-medium" : "text-fg-secondary")}>{guestLabel(search)}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-rausch text-white">
                    <Search size={12} strokeWidth={4} />
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="hidden flex-1 justify-end md:flex">
            <UserMenu hosting={hosting} />
          </div>
        </div>

        {variant === "expanded" && (
          <nav className="flex justify-center gap-6 pb-3 md:hidden" aria-label="Search categories">
            {TABS.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className={clsx(
                  "relative flex flex-col items-center gap-1 pb-2 text-xs",
                  t.match(pathname) ? "font-semibold text-fg" : "text-fg-secondary",
                )}
              >
                <span className="text-[32px] leading-none">{t.emoji}</span>
                {t.label}
                {t.match(pathname) && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-fg" />}
              </Link>
            ))}
          </nav>
        )}

        {big && variant !== "minimal" && (
          <div className="hidden px-10 md:block">
            <SearchBar key={routeKey} initial={search} initialPanel={expanded ? "where" : null} onDone={() => setExpanded(false)} />
          </div>
        )}
      </header>
      {mobileOpen && <MobileSearch initial={search} open onClose={() => setMobileOpen(false)} />}
    </>
  );
}

/** Placeholder with the header's height while the client component loads. */
export function HeaderFallback() {
  return <div className="h-20 border-b border-line-light" />;
}
