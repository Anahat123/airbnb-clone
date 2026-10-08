import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return (
    <PageShell>
      <ComingSoon emoji="💬" title="Messages" text="Chatting with hosts and guests isn't part of this demo yet. Booking details are on your Trips page." />
    </PageShell>
  );
}
