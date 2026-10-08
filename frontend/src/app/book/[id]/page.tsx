import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutView } from "@/components/checkout/CheckoutView";
import { Header, HeaderFallback } from "@/components/layout/Header";

export const metadata: Metadata = { title: "Confirm and pay" };

async function Checkout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CheckoutView listingId={id} />;
}

export default function BookPage({ params }: PageProps<"/book/[id]">) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header variant="minimal" wide logoOnly />
      </Suspense>
      <main className="mx-auto max-w-[1120px] px-6 md:px-20 xl:px-0">
        <Suspense>
          <Checkout params={params} />
        </Suspense>
      </main>
    </>
  );
}
