"use client";

import { Apple } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { Modal } from "@/components/ui/Modal";
import { Avatar, Button, Divider, TextField } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: User) => void;
}

/**
 * Mocked "Log in or sign up" flow: email first, then a name if the email is new.
 * No passwords (authentication is out of scope); demo accounts give one-click access.
 */
export function LoginModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"email" | "signup">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  useEffect(() => {
    api.demoUsers().then(setDemoUsers).catch(() => {});
  }, []);

  async function run(fn: () => Promise<{ token: string; user: User }>) {
    setBusy(true);
    setError("");
    try {
      const { token, user } = await fn();
      onSuccess(token, user);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404 && step === "email") setStep("signup");
      else setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const social = (label: string) => () => setError(`${label} sign-in is coming soon. Use your email or a demo account.`);

  return (
    <Modal
      open={open}
      onClose={step === "signup" ? () => setStep("email") : onClose}
      back={step === "signup"}
      bare
      size="md"
      title={step === "email" ? "Log in or sign up" : "Finish signing up"}
      bodyClassName="px-6 pb-8 pt-14 sm:px-12"
    >
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <span className="[&_svg]:h-12 [&_svg]:w-12">
          <Logo compact />
        </span>
        <h2 className="text-[28px] font-semibold leading-tight">{step === "email" ? "Log in or sign up" : "Finish signing up"}</h2>
      </div>

      {step === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.login(email));
          }}
        >
          <input
            type="email"
            name="email"
            aria-label="Email"
            autoComplete="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 w-full rounded-xl border border-line bg-transparent px-4 text-base outline-none focus:border-fg focus:ring-1 focus:ring-fg"
          />
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="mt-4 w-full !rounded-xl" loading={busy}>
            Continue
          </Button>

          <div className="my-6 flex items-center gap-4 text-sm text-fg-secondary">
            <Divider className="flex-1" /> or <Divider className="flex-1" />
          </div>
          <div className="flex justify-center gap-4">
            <button type="button" aria-label="Continue with Google" onClick={social("Google")} className="grid h-14 w-14 place-items-center rounded-xl border border-line text-xl font-bold hover:border-fg">
              G
            </button>
            <button type="button" aria-label="Continue with Apple" onClick={social("Apple")} className="grid h-14 w-14 place-items-center rounded-xl border border-line hover:border-fg">
              <Apple size={22} className="fill-current" />
            </button>
          </div>

          {demoUsers.length > 0 && (
            <div className="mt-8 rounded-2xl bg-bg-secondary p-4">
              <p className="mb-3 text-center text-xs text-fg-secondary">Demo accounts (no password needed)</p>
              <div className="space-y-2">
                {demoUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => run(() => api.login(u.email!))}
                    className="flex w-full items-center gap-3 rounded-xl bg-bg-elevated px-4 py-2.5 text-left hover:ring-1 hover:ring-fg"
                  >
                    <Avatar user={u} size={28} />
                    <span className="flex-1 text-sm font-medium">Continue as {u.name}</span>
                    <span className="text-xs text-fg-secondary">{u.is_host ? "Host" : "Guest"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.signup(name, email));
          }}
          className="space-y-4"
        >
          <p className="text-center text-sm text-fg-secondary">
            No account found for <strong className="text-fg">{email}</strong>. Tell us your name to create one.
          </p>
          <TextField label="Full name" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} error={error} />
          <Button type="submit" variant="primary" size="lg" className="w-full !rounded-xl" loading={busy}>
            Agree and continue
          </Button>
        </form>
      )}
    </Modal>
  );
}
