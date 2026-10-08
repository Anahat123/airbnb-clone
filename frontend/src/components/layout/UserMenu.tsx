"use client";

import { Globe, Menu, Moon, Sun, SunMoon } from "lucide-react";
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
    if (!user) return openLogin();
    if (!user.is_host) {
      await becomeHost();
      toast({ message: "You're now a host. Create your first listing!" });
    }
    router.push(hosting ? "/" : "/host");
  }

  const item = "block w-full px-4 py-3 text-left text-sm hover:bg-bg-hover";
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
        aria-label="Choose a language and currency"
        onClick={() => toast({ message: "Language & currency: English (IN), ₹ INR. More coming soon." })}
        className="hidden h-10 w-10 place-items-center rounded-full bg-bg-secondary hover:bg-line-light md:grid"
      >
        <Globe size={16} />
      </button>
      <div className="relative">
        <button
          aria-label="Main navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 items-center gap-2 rounded-full bg-bg-secondary pl-1 pr-3 hover:bg-line-light"
        >
          {user ? <Avatar user={user} size={32} /> : <span className="w-1" />}
          <Menu size={16} />
        </button>
        {open && (
          <div className="animate-fade-in absolute right-0 top-12 z-[1100] w-64 overflow-hidden rounded-2xl bg-bg-elevated py-2 shadow-pop">
            {user ? (
              <>
                <Link href="/wishlists" className={item} onClick={() => setOpen(false)}>Wishlists</Link>
                <Link href="/trips" className={item} onClick={() => setOpen(false)}>Trips</Link>
                <Link href="/messages" className={item} onClick={() => setOpen(false)}>Messages</Link>
                <Link href="/account" className={item} onClick={() => setOpen(false)}>Profile</Link>
                <hr className="my-2 border-line-light" />
                {user.is_host && (
                  <>
                    <Link href="/host" className={item} onClick={() => setOpen(false)}>Host dashboard</Link>
                    <Link href="/host/listings/new" className={item} onClick={() => setOpen(false)}>Create a new listing</Link>
                  </>
                )}
                {!user.is_host && <button className={item} onClick={switchToHosting}>Become a host</button>}
              </>
            ) : (
              <>
                <button className={clsx(item, "font-semibold")} onClick={() => { setOpen(false); openLogin(); }}>
                  Log in or sign up
                </button>
                <hr className="my-2 border-line-light" />
                <button className={item} onClick={switchToHosting}>Become a host</button>
              </>
            )}
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span>Theme</span>
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
            <Link href="/help" className={item} onClick={() => setOpen(false)}>Help Centre</Link>
            {user && (
              <>
                <hr className="my-2 border-line-light" />
                <button
                  className={item}
                  onClick={() => {
                    setOpen(false);
                    logout();
                    toast({ message: "You've been logged out" });
                    router.push("/");
                  }}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
