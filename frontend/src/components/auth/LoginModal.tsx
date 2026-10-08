"use client";

import { useEffect, useState } from "react";

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

  return (
    <Modal
      open={open}
      onClose={step === "signup" ? () => setStep("email") : onClose}
      back={step === "signup"}
      title={step === "email" ? "Log in or sign up" : "Finish signing up"}
    >
      {step === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.login(email));
          }}
        >
          <h3 className="mb-6 text-[22px] font-medium">Welcome to Airbnb</h3>
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <p className="mt-2 text-xs text-fg-secondary">
            This is a demo: there are no passwords. New emails create a guest account.
          </p>
          <Button type="submit" variant="primary" size="lg" className="mt-4 w-full" loading={busy}>
            Continue
          </Button>

          {demoUsers.length > 0 && (
            <>
              <div className="my-6 flex items-center gap-4 text-xs text-fg-secondary">
                <Divider className="flex-1" /> or try a demo account <Divider className="flex-1" />
              </div>
              <div className="space-y-3">
                {demoUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => run(() => api.login(u.email!))}
                    className="flex w-full items-center gap-3 rounded-lg border border-fg px-4 py-3 text-left hover:bg-bg-hover"
                  >
                    <Avatar user={u} size={32} />
                    <span className="flex-1 text-sm font-semibold">Continue as {u.name}</span>
                    <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs">{u.is_host ? "Host" : "Guest"}</span>
                  </button>
                ))}
              </div>
            </>
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
          <p className="text-sm text-fg-secondary">
            No account found for <strong className="text-fg">{email}</strong>. Tell us your name to create one.
          </p>
          <TextField label="Full name" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} error={error} />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
            Agree and continue
          </Button>
        </form>
      )}
    </Modal>
  );
}
