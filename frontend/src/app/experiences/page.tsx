import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Experiences" };

export default function Page() {
  return (
    <PageShell>
      <ComingSoon emoji="🎈" title="Experiences" text="Book activities hosted by locals. This part of Airbnb isn't included in the clone yet." />
    </PageShell>
  );
}
