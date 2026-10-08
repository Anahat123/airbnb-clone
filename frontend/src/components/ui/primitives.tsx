"use client";

import clsx from "clsx";
import { Minus, Plus, Star } from "lucide-react";
import { forwardRef } from "react";

/* ---------- Buttons ---------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "outline" | "ghost" | "grey";
  size?: "md" | "lg";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "dark", size = "md", loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.98] disabled:opacity-40",
        size === "lg" ? "h-12 px-6 text-base" : "h-10 px-5 text-sm",
        variant === "primary" && "bg-rausch-gradient text-white",
        variant === "dark" && "bg-fg text-bg hover:opacity-90",
        variant === "outline" && "border border-fg bg-transparent hover:bg-bg-hover",
        variant === "ghost" && "underline hover:bg-bg-hover",
        variant === "grey" && "bg-[#f2f2f2] font-medium text-[#222] hover:bg-[#ebebeb] dark:bg-bg-secondary dark:text-fg",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
});

export function Spinner() {
  return (
    <span className="flex gap-1" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

/* ---------- Counter (guests, bedrooms, ...) ---------- */

export function Counter({
  label,
  hint,
  value,
  min = 0,
  max = 16,
  onChange,
}: {
  label: string;
  hint?: React.ReactNode;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-sm text-fg-secondary">{hint}</div>}
      </div>
      <div className="flex items-center gap-4">
        <CircleButton aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus size={14} />
        </CircleButton>
        <span className="w-6 text-center tabular-nums" aria-live="polite">
          {value}
          {max >= 16 && value === max ? "+" : ""}
        </span>
        <CircleButton aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus size={14} />
        </CircleButton>
      </div>
    </div>
  );
}

function CircleButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="grid h-8 w-8 place-items-center rounded-full border border-line text-fg-secondary hover:border-fg hover:text-fg disabled:border-line-light disabled:text-line"
    />
  );
}

/* ---------- Avatar ---------- */

export function Avatar({
  user,
  size = 40,
  className,
}: {
  user: { name: string; avatar_url: string | null };
  size?: number;
  className?: string;
}) {
  if (user.avatar_url)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={user.name}
        width={size}
        height={size}
        className={clsx("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  return (
    <span
      className={clsx("grid shrink-0 place-items-center rounded-full bg-fg font-semibold text-bg", className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-label={user.name}
    >
      {user.name[0]?.toUpperCase()}
    </span>
  );
}

/* ---------- Rating ---------- */

export function RatingStar({ size = 12 }: { size?: number }) {
  return <Star size={size} className="fill-current" strokeWidth={0} aria-hidden />;
}

export function StarRow({ value, size = 10 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} strokeWidth={0} className={i <= value ? "fill-fg" : "fill-line"} />
      ))}
    </span>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton rounded-md", className)} />;
}

/* ---------- Form inputs ---------- */

export const TextField = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function TextField({ label, error, className, id, ...props }, ref) {
  const inputId = id ?? props.name;
  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={clsx(
          "block rounded-lg border px-3 pb-2 pt-1.5 focus-within:border-fg focus-within:ring-1 focus-within:ring-fg",
          error ? "border-error" : "border-line",
        )}
      >
        <span className="block text-xs text-fg-secondary">{label}</span>
        <input ref={ref} id={inputId} className="w-full bg-transparent text-base outline-none" {...props} />
      </label>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
});

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx("border-line-light", className)} />;
}
