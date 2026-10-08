"use client";

import { BadgeCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Avatar, Button } from "@/components/ui/primitives";
import { yearsSince } from "@/lib/format";

function Profile() {
  const { user, becomeHost } = useAuth();
  const toast = useToast();
  if (!user) return null;
  return (
    <div className="grid gap-12 md:grid-cols-[340px_1fr]">
      <div className="space-y-6">
        <div className="rounded-3xl p-8 text-center shadow-[0_6px_20px_rgb(0_0_0/0.2)]">
          <Avatar user={user} size={104} className="mx-auto" />
          <h1 className="mt-3 text-[32px] font-bold">{user.name.split(" ")[0]}</h1>
          <p className="text-sm font-semibold">{user.is_host ? "Host" : "Guest"}</p>
        </div>
        <div className="rounded-3xl border border-line p-6">
          <h2 className="text-[22px] font-medium">{user.name.split(" ")[0]}&apos;s confirmed information</h2>
          <p className="mt-4 flex items-center gap-3">
            <BadgeCheck size={20} /> Email address
          </p>
          <hr className="my-6 border-line-light" />
          <h3 className="text-lg font-semibold">Verify your identity</h3>
          <p className="mt-2 text-sm text-fg-secondary">
            Before you book or host on Airbnb, you&apos;ll need to complete this step.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => toast({ message: "Identity verification is coming soon" })}>
            <ShieldCheck size={16} /> Get verified
          </Button>
        </div>
      </div>
      <div>
        <h2 className="text-[32px] font-semibold">About {user.name.split(" ")[0]}</h2>
        <div className="mt-6 space-y-2 text-fg-secondary">
          <p>Email: {user.email}</p>
          {user.city && <p>Lives in {user.city}</p>}
          <p>On Airbnb for {yearsSince(user.created_at).replace(" hosting", "")}</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/trips" className="rounded-lg border border-fg px-5 py-3 font-semibold hover:bg-bg-hover">
            Your trips
          </Link>
          <Link href="/wishlists" className="rounded-lg border border-fg px-5 py-3 font-semibold hover:bg-bg-hover">
            Wishlists
          </Link>
          {user.is_host ? (
            <Link href="/host" className="rounded-lg bg-fg px-5 py-3 font-semibold text-bg">
              Host dashboard
            </Link>
          ) : (
            <Button variant="primary" size="lg" onClick={becomeHost}>
              Become a host
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <PageShell>
      <RequireAuth title="Profile">
        <Profile />
      </RequireAuth>
    </PageShell>
  );
}
