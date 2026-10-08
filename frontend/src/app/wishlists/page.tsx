import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageShell } from "@/components/layout/PageShell";
import { WishlistIndex } from "@/components/wishlist/WishlistViews";

export const metadata: Metadata = { title: "Wishlists" };

export default function WishlistsPage() {
  return (
    <PageShell>
      <RequireAuth title="Wishlists">
        <WishlistIndex />
      </RequireAuth>
    </PageShell>
  );
}
