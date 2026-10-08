import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="py-16">
        <h1 className="text-[64px] font-bold text-fg">Oops!</h1>
        <p className="text-2xl">We can&apos;t seem to find the page you&apos;re looking for.</p>
        <p className="mt-4 text-sm font-semibold text-fg-secondary">Error code: 404</p>
        <Link href="/" className="mt-8 inline-block font-semibold underline">
          Go back home
        </Link>
      </div>
    </PageShell>
  );
}
