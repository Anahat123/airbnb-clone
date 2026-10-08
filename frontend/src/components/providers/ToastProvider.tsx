"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";

interface Toast {
  id: number;
  message: string;
  image?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

type ShowToast = (toast: Omit<Toast, "id">) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

let nextId = 1;

/** Airbnb-style toasts: white cards stacked in the bottom-left corner, auto-dismissed. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback<ShowToast>(
    (toast) => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-2), { ...toast, id }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 left-4 right-4 z-[3000] flex flex-col gap-3 md:bottom-6 md:left-6 md:right-auto"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-up pointer-events-auto flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-3 text-sm shadow-pop md:w-[360px]"
          >
            {t.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            )}
            <p className="flex-1 font-medium">{t.message}</p>
            {t.action &&
              (t.action.href ? (
                <Link href={t.action.href} className="shrink-0 font-semibold underline" onClick={() => dismiss(t.id)}>
                  {t.action.label}
                </Link>
              ) : (
                <button
                  className="shrink-0 font-semibold underline"
                  onClick={() => {
                    t.action?.onClick?.();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              ))}
            <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="rounded-full p-1 hover:bg-bg-hover">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
