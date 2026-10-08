import type { Metadata } from "next";

import { PageShell } from "@/components/layout/PageShell";
import { HostProfile } from "@/components/profile/HostProfile";

export const metadata: Metadata = { title: "Host profile" };

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HostProfile userId={id} />;
}

export default function UserPage({ params }: PageProps<"/users/[id]">) {
  return (
    <PageShell header="minimal" wideHeader width="max-w-[1280px]">
      <Profile params={params} />
    </PageShell>
  );
}
