import Link from "next/link";

/** Placeholder for features that are out of scope for this assignment. */
export function ComingSoon({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-6xl">{emoji}</p>
      <span className="mt-6 inline-block rounded-full bg-bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide">Coming soon</span>
      <h1 className="mt-4 text-[32px] font-semibold">{title}</h1>
      <p className="mt-2 text-fg-secondary">{text}</p>
      <Link href="/" className="mt-8 inline-block rounded-lg bg-fg px-6 py-3 font-semibold text-bg">
        Explore homes
      </Link>
    </div>
  );
}
