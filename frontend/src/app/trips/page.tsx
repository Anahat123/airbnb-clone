import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageShell } from "@/components/layout/PageShell";
import { TripsView } from "@/components/trips/TripsView";

export const metadata: Metadata = { title: "Trips" };

export default function TripsPage() {
  return (
    <PageShell>
      <RequireAuth title="Trips">
        <TripsView />
      </RequireAuth>
    </PageShell>
  );
}
