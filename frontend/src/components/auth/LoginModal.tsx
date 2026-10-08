"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import type { User } from "@/lib/types";

import { LoginForm, type LoginStep } from "./LoginForm";

/** The "Log in or sign up" pop-up opened from the menu or when an action needs an account. */
export function LoginModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: User) => void;
}) {
  const [step, setStep] = useState<LoginStep>("email");
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
      <LoginForm step={step} onStepChange={setStep} onSuccess={onSuccess} />
    </Modal>
  );
}
