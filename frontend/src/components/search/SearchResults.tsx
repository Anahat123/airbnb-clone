"use client";

import clsx from "clsx";
import { List, Map as MapIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ListingCard, ListingCardSkeleton } from "@/components/listings/ListingCard";
import { type Bounds, ListingsMap } from "@/components/map";
import { ApiOffline } from "@/components/ui/ApiOffline";
import { api } from "@/lib/api";
import { readSearch } from "@/lib/search";
import type { Meta, Paginated, RoomType } from "@/lib/types";

import { CategoryBar } from "./CategoryBar";
import { countFilters, type Filters, FiltersModal, filtersToQuery } from "./FiltersModal";
import { Pagination } from "./Pagination";

const FILTER_KEYS = ["room_type", "min_price", "max_price", "bedrooms", "beds", "bathrooms", "amenities", "property_types", "guest_favourite"];
const BOUND_KEYS = ["sw_lat", "sw_lng", "ne_lat", "ne_lng"];

function readFilters(p: URLSearchParams): Filters {
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : null);
  return {
    room_type: (p.get("room_type") as RoomType) || null,
    min_price: num("min_price"),
    max_price: num("max_price"),
    bedrooms: num("bedrooms") ?? 0,
    beds: num("beds") ?? 0,
    bathrooms: num("bathrooms") ?? 0,
    amenities: (p.get("amenities") ?? "").split(",").filter(Boolean).map(Number),
    property_types: (p.get("property_types") ?? "").split(",").filter(Boolean),
    guest_favourite: p.get("guest_favourite") === "true",
  };
}

/**
 * The /s page: category row + filters, results grid with pagination, and a map.
 * All state is read from and written to the URL; fetching re-runs when it changes.
 */
export function SearchResults({ meta }: { meta: Meta }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = useMemo(() => readSearch(params), [params]);
  const filters = useMemo(() => readFilters(new URLSearchParams(params.toString())), [params]);
  const category = params.get("category");
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const hasBounds = BOUND_KEYS.every((k) => params.get(k));

  // Results are stored with the query they answer; "loading" means they're for an older query.
  const [result, setResult] = useState<{ key: string; data: Paginated | null; error: boolean } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(false); // mobile toggle
  const [searchOnMove, setSearchOnMove] = useState(true);

  // Base query for the backend (everything except filters & paging), shared with the filter modal's count.
  const baseQuery = useMemo(
    () => ({
      location: search.location,
      check_in: search.checkIn && search.checkOut ? search.checkIn : null,
      check_out: search.checkIn && search.checkOut ? search.checkOut : null,
      guests: Math.max(1, search.adults + search.children),
      category,
      ...Object.fromEntries(BOUND_KEYS.map((k) => [k, params.get(k)])),
    }),
    [search, category, params],
  );

  const query = useMemo(() => ({ ...baseQuery, ...filtersToQuery(filters), page }), [baseQuery, filters, page]);
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    api
      .search(query)
      .then((d) => !cancelled && setResult({ key: queryKey, data: d, error: false }))
      .catch(() => !cancelled && setResult((r) => ({ key: queryKey, data: r?.data ?? null, error: true })));
    return () => {
      cancelled = true;
    };
  }, [query, queryKey]);

  const data = result?.data ?? null;
  const error = result?.error ?? false;
  const loading = result?.key !== queryKey;

  /** Merge changes into the URL. Any change other than paging goes back to page 1. */
  const update = useCallback(
    (patch: Record<string, string | number | boolean | null | undefined>, keepPage = false) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "" || v === false) next.delete(k);
        else next.set(k, String(v));
      }
      if (!keepPage) next.delete("page");
      router.push(`${pathname}?${next}`, { scroll: keepPage });
    },
    [params, pathname, router],
  );

  const applyFilters = (f: Filters) => {
    setFiltersOpen(false);
    update({ ...Object.fromEntries(FILTER_KEYS.map((k) => [k, null])), ...filtersToQuery(f) });
  };

  const onMapMove = useCallback(
    (b: Bounds) => {
      if (searchOnMove) update({ ...b, location: null });
    },
    [searchOnMove, update],
  );

  const dates = search.checkIn && search.checkOut ? { checkIn: search.checkIn, checkOut: search.checkOut } : null;
  const place = search.location.split(",")[0];
  const heading = data
    ? `${data.total > 1000 ? "Over 1,000" : data.total} home${data.total === 1 ? "" : "s"}${place ? ` in ${place}` : hasBounds ? " within map area" : ""}`
    : "";

  return (
    <>
      <div className="sticky top-20 z-[800] border-b border-line-light bg-bg px-6 pt-4 md:px-10 xl:px-12">
        <CategoryBar
          categories={meta.categories}
          active={category}
          onSelect={(slug) => update({ category: slug })}
          filterCount={countFilters(filters)}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      </div>

      <div className="flex">
        <section className={clsx("w-full px-6 pb-16 pt-6 md:px-10 lg:w-1/2 xl:pl-12", showMap && "hidden lg:block")}>
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-lg font-semibold">{loading && !data ? <span className="skeleton block h-6 w-48 rounded" /> : heading}</h1>
            {hasBounds && (
              <button className="text-sm font-semibold underline" onClick={() => update(Object.fromEntries(BOUND_KEYS.map((k) => [k, null])))}>
                Clear map area
              </button>
            )}
          </div>

          {error ? (
            <ApiOffline />
          ) : (
            <div className={clsx("grid gap-x-6 gap-y-10 sm:grid-cols-2 min-[1800px]:grid-cols-3", loading && data && "opacity-60 transition-opacity")}>
              {!data
                ? Array.from({ length: 6 }, (_, i) => <ListingCardSkeleton key={i} />)
                : data.items.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      dates={dates}
                      onHover={setHovered}
                      href={`/rooms/${l.id}?${new URLSearchParams(
                        Object.fromEntries(
                          Object.entries({ check_in: search.checkIn, check_out: search.checkOut, adults: search.adults || null })
                            .filter(([, v]) => v)
                            .map(([k, v]) => [k, String(v)]),
                        ),
                      )}`}
                    />
                  ))}
            </div>
          )}

          {data && data.total === 0 && !loading && (
            <div className="py-16 text-center">
              <h2 className="text-xl font-semibold">No exact matches</h2>
              <p className="mt-2 text-fg-secondary">Try changing or removing some of your filters or adjusting your search area.</p>
              <button className="mt-6 rounded-lg border border-fg px-5 py-3 font-semibold" onClick={() => router.push(pathname)}>
                Remove all filters
              </button>
            </div>
          )}

          {data && (
            <div className="mt-12 space-y-3 text-center">
              <Pagination page={page} totalPages={data.total_pages} onPage={(p) => update({ page: p }, true)} />
              {data.total > 0 && (
                <p className="text-sm text-fg-secondary">
                  {(page - 1) * data.page_size + 1} – {Math.min(page * data.page_size, data.total)} of {data.total} places to stay
                </p>
              )}
            </div>
          )}
        </section>

        <aside className={clsx("sticky top-[176px] h-[calc(100dvh-176px)] flex-1 p-0 lg:block lg:pb-6 lg:pr-10 lg:pt-6 xl:pr-12", showMap ? "block" : "hidden")}>
          <div className="relative h-full overflow-hidden lg:rounded-2xl">
            <ListingsMap listings={data?.items ?? []} activeId={hovered} onMove={onMapMove} fitToListings={!hasBounds} />
            <label className="absolute left-1/2 top-4 z-[500] flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-lg bg-bg-elevated px-4 py-2 text-sm font-semibold shadow-pop">
              <input type="checkbox" checked={searchOnMove} onChange={(e) => setSearchOnMove(e.target.checked)} className="h-4 w-4 accent-fg" />
              Search as I move the map
            </label>
          </div>
        </aside>
      </div>

      <button
        onClick={() => setShowMap((s) => !s)}
        className="fixed bottom-24 left-1/2 z-[900] flex -translate-x-1/2 items-center gap-2 rounded-full bg-fg px-5 py-3.5 text-sm font-semibold text-bg shadow-pop transition hover:scale-105 lg:hidden"
      >
        {showMap ? (
          <>
            Show list <List size={16} />
          </>
        ) : (
          <>
            Show map <MapIcon size={16} />
          </>
        )}
      </button>

      {filtersOpen && <FiltersModal open onClose={() => setFiltersOpen(false)} meta={meta} value={filters} onApply={applyFilters} baseQuery={baseQuery} />}
    </>
  );
}
