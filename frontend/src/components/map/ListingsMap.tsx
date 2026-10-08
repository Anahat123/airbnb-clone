"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { imageUrl, listingHeadline, money, rating } from "@/lib/format";
import type { ListingCard } from "@/lib/types";

import { ATTRIBUTION, TILES } from "./tiles";

export interface Bounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

interface Props {
  listings: ListingCard[];
  activeId: number | null;
  /** Called after the user pans/zooms, with the visible bounds. */
  onMove?: (bounds: Bounds) => void;
  /** When true, the map fits itself to the listings whenever they change. */
  fitToListings: boolean;
}


function priceIcon(listing: ListingCard, active: boolean) {
  const price = money(listing.total_price ?? listing.price_per_night);
  return L.divIcon({
    className: "", // drop Leaflet's default white square
    html: `<span class="price-pin${active ? " active" : ""}">${price}</span>`,
    iconSize: [0, 0],
  });
}

function FitBounds({ listings, enabled }: { listings: ListingCard[]; enabled: boolean }) {
  const map = useMap();
  const key = listings.map((l) => l.id).join(",");
  useEffect(() => {
    if (!enabled || listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    // Only refit when the set of listings changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, map]);
  return null;
}

function MoveListener({ onMove }: { onMove?: (b: Bounds) => void }) {
  const userMoved = useRef(false);
  useMapEvents({
    dragstart: () => (userMoved.current = true),
    zoomstart: (e) => {
      // Programmatic fitBounds zooms shouldn't trigger a search.
      if ((e as unknown as { originalEvent?: Event }).originalEvent) userMoved.current = true;
    },
    moveend: (e) => {
      if (!userMoved.current || !onMove) return;
      userMoved.current = false;
      const b = e.target.getBounds();
      onMove({ sw_lat: b.getSouth(), sw_lng: b.getWest(), ne_lat: b.getNorth(), ne_lng: b.getEast() });
    },
  });
  return null;
}

export default function ListingsMap({ listings, activeId, onMove, fitToListings }: Props) {
  const center = useMemo<[number, number]>(() => [20.6, 78.9], []); // India

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom className="h-full w-full" zoomControl={false}>
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      <FitBounds listings={listings} enabled={fitToListings} />
      <MoveListener onMove={onMove} />
      {listings.map((l) => (
        <Marker
          key={l.id}
          position={[l.latitude, l.longitude]}
          icon={priceIcon(l, l.id === activeId)}
          zIndexOffset={l.id === activeId ? 1000 : 0}
        >
          <Popup closeButton={false} offset={[0, -10]}>
            <a href={`/rooms/${l.id}`} className="block text-[var(--fg)] no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(l.photos[0], 560)} alt="" className="aspect-[3/2] w-full object-cover" />
              <div className="p-3 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>{listingHeadline(l)}</span>
                  {l.average_rating && <span>★ {rating(l.average_rating)}</span>}
                </div>
                <div className="truncate text-[var(--fg-secondary)]">{l.title}</div>
                <div className="mt-1">
                  <strong>{money(l.total_price ?? l.price_per_night)}</strong>{" "}
                  {l.nights ? `for ${l.nights} nights` : "night"}
                </div>
              </div>
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
