import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Help Centre" };

export default function Page() {
  return (
    <PageShell>
      <ComingSoon emoji="🛟" title="Help Centre" text="Support articles are coming soon. For this demo, try booking a stay or listing your own place." />
    </PageShell>
  );
}
