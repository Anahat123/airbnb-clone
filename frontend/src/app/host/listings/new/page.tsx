import type { Metadata } from "next";

import { ListingWizard } from "@/components/host/ListingWizard";

export const metadata: Metadata = { title: "Create a listing" };

export default function NewListingPage() {
  return <ListingWizard />;
}
