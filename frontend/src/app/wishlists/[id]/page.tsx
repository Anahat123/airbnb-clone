import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageShell } from "@/components/layout/PageShell";
import { WishlistDetail } from "@/components/wishlist/WishlistViews";

export const metadata: Metadata = { title: "Wishlist" };

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WishlistDetail id={id} />;
}

export default function WishlistPage({ params }: PageProps<"/wishlists/[id]">) {
  return (
    <PageShell width="max-w-[1440px]">
      <RequireAuth title="Wishlist">
        <Detail params={params} />
      </RequireAuth>
    </PageShell>
  );
}
