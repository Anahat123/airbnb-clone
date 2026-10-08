import type { Metadata } from "next";
import { Suspense } from "react";

import { ListingWizard } from "@/components/host/ListingWizard";

export const metadata: Metadata = { title: "Edit listing" };

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingWizard listingId={id} />;
}

export default function EditListingPage({ params }: PageProps<"/host/listings/[id]/edit">) {
  return (
    <Suspense>
      <Editor params={params} />
    </Suspense>
  );
}
