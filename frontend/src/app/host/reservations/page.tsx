import type { Metadata } from "next";

import { HostNav } from "@/components/host/HostNav";
import { HostReservations } from "@/components/host/HostViews";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Reservations" };

export default function Page() {
  return (
    <PageShell header="minimal" width="max-w-[1280px]">
      <HostNav />
      <HostReservations />
    </PageShell>
  );
}
