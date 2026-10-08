"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

import { LoginForm, type LoginStep } from "./LoginForm";
import { PosterWall } from "./PosterWall";

/** Only allow redirects within this site (never to another domain). */
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

/**
 * Full-page "Log in or sign up", like airbnb.co.in/login: the card over a poster wall.
 * `?next=/host&host=1` (used by "Become a host") also switches the account to hosting.
 */
export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, setSession } = useAuth();
  const [step, setStep] = useState<LoginStep>("email");
  const next = safeNext(params.get("next"));
  const wantsHost = params.get("host") === "1";

  // Already logged in (e.g. back button): go straight on.
  useEffect(() => {
    if (!loading && user && !wantsHost) router.replace(next);
  }, [loading, user, wantsHost, next, router]);

  async function onSuccess(token: string, u: User) {
    setSession(token, u);
    if (wantsHost && !u.is_host) {
      await api.becomeHost();
      window.location.assign(next); // full load so the session picks up the new host role
      return;
    }
    router.replace(next);
  }

  return (
    <div className="relative grid min-h-[calc(100dvh-80px)] place-items-center overflow-hidden px-4 py-12 md:min-h-[calc(100dvh-96px)]">
      <PosterWall />
      <div className="relative w-full max-w-[568px] rounded-[32px] bg-bg-elevated px-6 pb-10 pt-12 shadow-pop sm:px-12">
        {step === "signup" && (
          <button onClick={() => setStep("email")} className="absolute left-6 top-6 text-sm font-medium underline">
            Back
          </button>
        )}
        <LoginForm step={step} onStepChange={setStep} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
