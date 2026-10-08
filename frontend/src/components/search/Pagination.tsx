"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Page numbers with ellipses: 1 2 3 … 9, like Airbnb's results footer. */
export function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const btn = "grid h-8 min-w-8 place-items-center rounded-full px-2 text-sm";
  return (
    <nav aria-label="Search results pages" className="flex items-center justify-center gap-2">
      <button aria-label="Previous" disabled={page === 1} onClick={() => onPage(page - 1)} className={clsx(btn, "hover:bg-bg-hover disabled:opacity-30")}>
        <ChevronLeft size={16} />
      </button>
      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1">…</span>
        ) : (
          <button
            key={p}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPage(p)}
            className={clsx(btn, p === page ? "bg-fg font-semibold text-bg" : "hover:bg-bg-hover")}
          >
            {p}
          </button>
        ),
      )}
      <button aria-label="Next" disabled={page === totalPages} onClick={() => onPage(page + 1)} className={clsx(btn, "hover:bg-bg-hover disabled:opacity-30")}>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
