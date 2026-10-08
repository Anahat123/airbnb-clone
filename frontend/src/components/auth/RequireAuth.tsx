"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button, Skeleton } from "@/components/ui/primitives";

/** Renders children only for logged-in users (and optionally hosts); otherwise a login prompt. */
export function RequireAuth({
  children,
  title = "Log in to continue",
  host = false,
}: {
  children: React.ReactNode;
  title?: string;
  host?: boolean;
}) {
  const { user, loading, openLogin, becomeHost } = useAuth();

  if (loading)
    return (
      <div className="space-y-4 py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
      </div>
    );

  if (!user)
    return (
      <div className="max-w-md py-16">
        <h1 className="text-[32px] font-semibold">{title}</h1>
        <p className="mt-2 text-fg-secondary">Log in or create an account to see this page.</p>
        <Button variant="primary" size="lg" className="mt-6" onClick={openLogin}>
          Log in
        </Button>
      </div>
    );

  if (host && !user.is_host)
    return (
      <div className="max-w-md py-16">
        <h1 className="text-[32px] font-semibold">Airbnb it.</h1>
        <p className="mt-2 text-fg-secondary">Switch to hosting to list your place and manage reservations.</p>
        <Button variant="primary" size="lg" className="mt-6" onClick={becomeHost}>
          Become a host
        </Button>
      </div>
    );

  return <>{children}</>;
}
