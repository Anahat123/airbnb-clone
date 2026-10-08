"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/host", label: "Today", exact: true },
  { href: "/host/listings", label: "Listings" },
  { href: "/host/reservations", label: "Reservations" },
];

export function HostNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap",
              active ? "bg-fg text-bg" : "bg-bg-secondary hover:bg-line-light",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
