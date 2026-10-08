import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderFallback } from "@/components/layout/Header";
import { ListingCardSkeleton } from "@/components/listings/ListingCard";
import { ListingRow } from "@/components/listings/ListingRow";
import { ApiOffline } from "@/components/ui/ApiOffline";
import { api } from "@/lib/api";

async function HomeSections() {
  let sections;
  try {
    sections = await api.home();
  } catch {
    return <ApiOffline />;
  }
  return (
    <>
      {sections.map((s) => (
        <ListingRow key={s.city} title={s.title} href={`/s?location=${encodeURIComponent(s.city)}`} items={s.items} />
      ))}
    </>
  );
}

function HomeSkeleton() {
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

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header variant="expanded" />
      </Suspense>
      <main className="mx-auto max-w-[1440px] px-6 pt-4 md:px-10 xl:px-12">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeSections />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
