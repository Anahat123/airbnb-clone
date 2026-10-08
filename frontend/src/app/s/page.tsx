import type { Metadata } from "next";
import { Suspense } from "react";

import { Header, HeaderFallback } from "@/components/layout/Header";
import { ListingCardSkeleton } from "@/components/listings/ListingCard";
import { SearchResults } from "@/components/search/SearchResults";
import { ApiOffline } from "@/components/ui/ApiOffline";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Search stays" };

async function Results() {
  let meta;
  try {
    meta = await api.meta();
  } catch {
    return <ApiOffline />;
  }
  return <SearchResults meta={meta} />;
}

function ResultsSkeleton() {
  return (
    <div className="px-6 pt-6 md:px-10 xl:px-12">
      <div className="mb-8 flex gap-8">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="skeleton h-12 w-16 rounded" />
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:w-[55%] xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header variant="compact" />
      </Suspense>
      <main>
        <Suspense fallback={<ResultsSkeleton />}>
          <Results />
        </Suspense>
      </main>
    </>
  );
}
