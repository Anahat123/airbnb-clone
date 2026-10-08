import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderFallback } from "@/components/layout/Header";
import { ListingCardSkeleton } from "@/components/listings/ListingCard";
import { ListingRow } from "@/components/listings/ListingRow";

import { Inspiration } from "./Inspiration";
import { ApiOffline } from "@/components/ui/ApiOffline";
import { api } from "@/lib/api";

type Group = "city" | "category";

async function Sections({ group }: { group: Group }) {
  let sections;
  try {
    sections = await api.home(group);
  } catch {
    return <ApiOffline />;
  }
  return (
    <>
      {sections.map((s) => (
        <ListingRow key={s.search_query} title={s.title} subtitle={s.subtitle} href={`/s?${s.search_query}`} items={s.items} />
      ))}
    </>
  );
}

function SectionsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <section key={row} className="py-4">
          <div className="skeleton mb-4 h-6 w-72 rounded" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={i >= 2 ? "hidden md:block" : ""}>
                <ListingCardSkeleton compact />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/**
 * The explore page behind the All tab (rows by city) and the Homes tab (rows by category).
 * Rows are fetched on the server and stream in behind skeletons.
 */
export function HomePage({ group }: { group: Group }) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header variant="expanded" />
      </Suspense>
      <main className="mx-auto max-w-[1440px] px-6 pt-8 md:px-10 xl:px-12">
        <Suspense fallback={<SectionsSkeleton />}>
          <Sections group={group} />
        </Suspense>
      </main>
      <div className="mt-16">
        <Inspiration />
      </div>
      <Footer flush />
    </>
  );
}
