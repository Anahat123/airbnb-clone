import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Services" };

export default function Page() {
  return (
    <PageShell>
      <ComingSoon emoji="🛎️" title="Services" text="Book chefs, photographers and more. This part of Airbnb isn't included in the clone yet." />
    </PageShell>
  );
}
