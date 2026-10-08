"use client";

import clsx from "clsx";
import { ChevronLeft, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Show a back chevron instead of an X (used for nested steps). */
  back?: boolean;
  /** Put the close button on the right, as in Airbnb's Filters modal. */
  closeRight?: boolean;
  bodyClassName?: string;
}

const widths = {
  sm: "md:max-w-[420px]",
  md: "md:max-w-[568px]",
  lg: "md:max-w-[780px]",
  xl: "md:max-w-[1032px]",
  full: "md:max-w-none md:h-full md:rounded-none",
};

/** Airbnb modal: slides up as a sheet on mobile, centred card on desktop. Esc and backdrop close it. */
export function Modal({ open, onClose, title, children, footer, size = "md", back, closeRight, bodyClassName }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true">
      <div className="animate-fade-in absolute inset-0 bg-[var(--overlay)]" onClick={onClose} />
      <div
        className={clsx(
          "animate-fade-up relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg-elevated shadow-pop md:max-h-[90vh] md:rounded-3xl",
          widths[size],
        )}
      >
        <header className="relative flex min-h-16 shrink-0 items-center justify-center border-b border-line-light px-16 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={back ? "Back" : "Close"}
            className={clsx("absolute grid h-8 w-8 place-items-center rounded-full hover:bg-bg-hover", closeRight ? "right-6" : "left-6")}
          >
            {back ? <ChevronLeft size={18} /> : <X size={18} />}
          </button>
          {title && <h2 className="text-base font-semibold">{title}</h2>}
        </header>
        <div className={clsx("flex-1 overflow-y-auto p-6", bodyClassName)}>{children}</div>
        {footer && <footer className="shrink-0 border-t border-line-light px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
