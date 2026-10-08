import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header, HeaderFallback } from "@/components/layout/Header";
import { AvailabilitySection } from "@/components/listing/AvailabilitySection";
import { BookingCard, MobileBookingBar } from "@/components/listing/BookingCard";
import { BookingProvider } from "@/components/listing/BookingContext";
import { LocationSection } from "@/components/listing/LocationSection";
import { PhotoGallery, TitleActions } from "@/components/listing/PhotoGallery";
import { Reviews } from "@/components/listing/Reviews";
import {
  Amenities,
  Description,
  GuestFavouriteBanner,
  Highlights,
  HostedBy,
  MeetHost,
  ThingsToKnow,
} from "@/components/listing/Sections";
import { ApiOffline } from "@/components/ui/ApiOffline";
import { RatingStar, Skeleton } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { plural, rating, roomTypeLabel } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const l = await api.listing(id);
    return { title: `${l.title} - ${l.property_type}s for Rent in ${l.city}, ${l.state}`, description: l.description.slice(0, 160) };
  } catch {
    return { title: "Listing" };
  }
}

async function ListingContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let listing, availability;
  try {
    [listing, availability] = await Promise.all([api.listing(id), api.availability(id)]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 422)) notFound();
    return <ApiOffline />;
  }

  const kind = listing.room_type === "entire_home" ? `Entire ${listing.property_type.toLowerCase()}` : roomTypeLabel[listing.room_type];

  return (
    <BookingProvider listing={listing} availability={availability}>
      <div className="flex items-end justify-between gap-4 pb-6 pt-6 max-md:-order-1">
        <h1 className="text-[22px] font-semibold md:text-[26px]">{listing.title}</h1>
        <TitleActions listingId={listing.id} photos={listing.photos} />
      </div>
      <div className="relative max-md:-order-2">
        <Link
          href="/"
          aria-label="Back"
          className="absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-[#222] shadow md:hidden"
        >
          ‹
        </Link>
        <PhotoGallery photos={listing.photos} title={listing.title} listingId={listing.id} />
      </div>

      <div className="grid gap-x-20 md:grid-cols-[minmax(0,1fr)_minmax(0,372px)] lg:gap-x-24">
        <div>
          <section className="py-8">
            <h2 className="text-[22px] font-semibold">
              {kind} in {listing.city}, {listing.country}
            </h2>
            <p className="mt-1">
              {plural(listing.max_guests, "guest")} · {plural(listing.bedrooms, "bedroom")} · {plural(listing.beds, "bed")} ·{" "}
              {plural(listing.bathrooms, "bathroom")}
            </p>
            {!listing.is_guest_favourite && (
              <p className="mt-1 flex items-center gap-1 font-semibold">
                <RatingStar size={14} />
                {listing.average_rating ? rating(listing.average_rating) : "New"}
                {listing.review_count > 0 && (
                  <>
                    {" · "}
                    <a href="#reviews" className="underline">
                      {plural(listing.review_count, "review")}
                    </a>
                  </>
                )}
              </p>
            )}
          </section>
          {listing.is_guest_favourite && <GuestFavouriteBanner listing={listing} />}
          <div className="border-b border-line-light">
            <HostedBy host={listing.host} />
          </div>
          <div className="border-b border-line-light">
            <Highlights listing={listing} />
          </div>
          <div className="border-b border-line-light">
            <Description text={listing.description} />
          </div>
          <Amenities amenities={listing.amenities} />
          <AvailabilitySection />
        </div>
        <aside className="relative hidden md:block">
          <div className="sticky top-28 pt-8">
            <BookingCard />
          </div>
        </aside>
      </div>

      <Reviews listing={listing} />
      <LocationSection listing={listing} />
      <MeetHost host={listing.host} />
      <ThingsToKnow listing={listing} />
      <MobileBookingBar />
    </BookingProvider>
  );
}

function ListingSkeleton() {
  return (
    <div className="pt-6">
      <Skeleton className="mb-6 h-8 w-1/2" />
      <Skeleton className="h-[min(476px,42vw)] rounded-xl" />
      <div className="mt-8 grid gap-20 md:grid-cols-[1fr_372px]">
        <div className="space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Skeleton className="hidden h-72 rounded-xl md:block" />
      </div>
    </div>
  );
}

export default function ListingPage({ params }: PageProps<"/rooms/[id]">) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <div className="hidden md:block">
          <Header variant="compact" sticky={false} />
        </div>
      </Suspense>
      <main className="mx-auto flex max-w-[1120px] flex-col px-6 pb-24 md:block md:px-10 xl:px-0">
        <Suspense fallback={<ListingSkeleton />}>
          <ListingContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
