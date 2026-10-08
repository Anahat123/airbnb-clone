"use client";

import { CircleHelp, CircleUserRound, Globe, Heart, Luggage, Menu, MessageSquare, Moon, Sun, SunMoon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { useAuth } from "@/components/providers/AuthProvider";
import { type Theme, useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Avatar } from "@/components/ui/primitives";

export function UserMenu({ hosting = false }: { hosting?: boolean }) {
  const { user, logout, openLogin, becomeHost } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function switchToHosting() {
    setOpen(false);
    // Logged out: Airbnb sends you to its full-page login, then on to hosting.
    if (!user) return router.push("/login?next=/host&host=1");
    if (!user.is_host) {
      await becomeHost();
      toast({ message: "You're now a host. Create your first listing!" });
    }
    router.push(hosting ? "/" : "/host");
  }

  const item = "flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-bg-hover";
  const close = () => setOpen(false);
  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun size={14} />, label: "Light" },
    { value: "dark", icon: <Moon size={14} />, label: "Dark" },
    { value: "system", icon: <SunMoon size={14} />, label: "Auto" },
  ];

  return (
    <div className="flex items-center gap-1" ref={ref}>
      <button onClick={switchToHosting} className="hidden rounded-full px-4 py-3 text-sm font-medium hover:bg-bg-hover lg:block">
        {hosting ? "Switch to travelling" : user?.is_host ? "Switch to hosting" : "Become a host"}
      </button>
      <button
        aria-label={user ? "Profile" : "Log in"}
        onClick={() => (user ? router.push("/account") : openLogin())}
        className="ml-1 grid h-12 w-12 place-items-center rounded-full bg-[#f2f2f2] text-[#222] hover:bg-[#ebebeb] dark:bg-bg-secondary dark:text-fg"
      >
        {user ? <Avatar user={user} size={36} /> : <CircleUserRound size={24} strokeWidth={1.6} />}
      </button>
      <div className="relative">
        <button
          aria-label="Main navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="grid h-12 w-12 place-items-center rounded-full bg-[#f2f2f2] text-[#222] hover:bg-[#ebebeb] dark:bg-bg-secondary dark:text-fg"
        >
          <Menu size={18} />
        </button>
        {open && (
          <div className="animate-fade-in absolute right-0 top-14 z-[1100] w-[300px] overflow-hidden rounded-2xl bg-bg-elevated py-2 shadow-pop">
            {user && (
              <>
                <Link href="/wishlists" className={item} onClick={close}>
                  <Heart size={18} /> Wishlists
                </Link>
                <Link href="/trips" className={item} onClick={close}>
                  <Luggage size={18} /> Trips
                </Link>
                <Link href="/messages" className={item} onClick={close}>
                  <MessageSquare size={18} /> Messages
                </Link>
                <Link href="/account" className={item} onClick={close}>
                  <CircleUserRound size={18} /> Profile
                </Link>
                <hr className="mx-6 my-2 border-line-light" />
              </>
            )}
            <button className={item} onClick={() => { close(); toast({ message: "English (IN) · ₹ INR. More languages coming soon." }); }}>
              <Globe size={18} /> Languages &amp; currency
            </button>
            <Link href="/help" className={item} onClick={close}>
              <CircleHelp size={18} /> Help Centre
            </Link>
            <div className="flex items-center justify-between px-6 py-3">
              <span className="flex items-center gap-3">
                <SunMoon size={18} /> Theme
              </span>
              <div className="flex rounded-full bg-bg-secondary p-0.5">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    aria-label={`${t.label} theme`}
                    title={t.label}
                    onClick={() => setTheme(t.value)}
                    className={clsx("grid h-7 w-8 place-items-center rounded-full", theme === t.value && "bg-bg-elevated shadow")}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>
            <hr className="mx-6 my-2 border-line-light" />
            {user?.is_host ? (
              <>
                <Link href="/host" className={item} onClick={close}>Host dashboard</Link>
                <Link href="/host/listings/new" className={item} onClick={close}>Create a new listing</Link>
              </>
            ) : (
              <button className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-bg-hover" onClick={switchToHosting}>
                <span className="flex-1">
                  <span className="block font-medium">Become a host</span>
                  <span className="block text-sm text-fg-secondary">It&apos;s easy to start hosting and earn extra income.</span>
                </span>
                <span className="text-4xl" aria-hidden>🧳</span>
              </button>
            )}
            <hr className="mx-6 my-2 border-line-light" />
            <button className={item} onClick={() => { close(); toast({ message: "Referrals are coming soon" }); }}>Refer a host</button>
            <button className={item} onClick={() => { close(); toast({ message: "Co-hosting is coming soon" }); }}>Find a co-host</button>
            <hr className="mx-6 my-2 border-line-light" />
            {user ? (
              <button
                className={item}
                onClick={() => {
                  close();
                  logout();
                  toast({ message: "You've been logged out" });
                  router.push("/");
                }}
              >
                Log out
              </button>
            ) : (
              <button className={item} onClick={() => { close(); openLogin(); }}>
                Log in or sign up
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
