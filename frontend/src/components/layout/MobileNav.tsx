"use client";

import clsx from "clsx";
import { CircleUserRound, Heart, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";

/** Bottom tab bar on phones, as on Airbnb's mobile web. */
export function MobileNav() {
  const pathname = usePathname();
  const { user, openLogin } = useAuth();

  const tab = (active: boolean) =>
    clsx("flex flex-1 flex-col items-center gap-1 pt-2 text-[10px] font-medium", active ? "text-rausch" : "text-fg-secondary");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] flex h-16 border-t border-line-light bg-bg md:hidden">
      <Link href="/" className={tab(pathname === "/" || pathname.startsWith("/s"))}>
        <Search size={24} strokeWidth={1.8} /> Explore
      </Link>
      <Link href="/wishlists" className={tab(pathname.startsWith("/wishlists"))}>
        <Heart size={24} strokeWidth={1.8} /> Wishlists
      </Link>
      {user ? (
        <>
          <Link href="/trips" className={tab(pathname.startsWith("/trips"))}>
            <svg viewBox="0 0 32 32" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M16 3c-4.5 0-9 3.5-9 9 0 7 9 17 9 17s9-10 9-17c0-5.5-4.5-9-9-9Z" />
            </svg>
            Trips
          </Link>
          <Link href={user.is_host ? "/host" : "/account"} className={tab(pathname.startsWith("/account") || pathname.startsWith("/host"))}>
            <CircleUserRound size={24} strokeWidth={1.8} /> {user.is_host ? "Hosting" : "Profile"}
          </Link>
        </>
      ) : (
        <button onClick={openLogin} className={tab(false)}>
          <CircleUserRound size={24} strokeWidth={1.8} /> Log in
        </button>
      )}
    </nav>
  );
}
