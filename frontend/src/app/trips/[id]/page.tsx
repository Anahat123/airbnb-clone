import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageShell } from "@/components/layout/PageShell";
import { TripDetail } from "@/components/trips/TripDetail";

export const metadata: Metadata = { title: "Your reservation" };

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripDetail id={id} />;
}

export default function TripPage({ params }: PageProps<"/trips/[id]">) {
  return (
    <PageShell>
      <RequireAuth title="Your reservation">
        <Detail params={params} />
      </RequireAuth>
    </PageShell>
  );
}
