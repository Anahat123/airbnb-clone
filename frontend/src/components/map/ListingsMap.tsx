"use client";

import L from "leaflet";
import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

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
  expanded?: boolean;
  onToggleExpand?: () => void;
}

function priceIcon(listing: ListingCard, active: boolean) {
  const price = money(listing.total_price ?? listing.price_per_night);
  return L.divIcon({
    className: "", // drop Leaflet's default white square
    html: `<span class="price-pin${active ? " active" : ""}">${price}</span>`,
    iconSize: [0, 0],
  });
}

/**
 * Fits the map to the listings and reports user pans/zooms.
 * The map loads after the page, so its box can have zero size at first; we call
 * invalidateSize() before fitting (and again when the box resizes), otherwise
 * Leaflet computes the fit for a 0x0 map and lands somewhere random.
 */
function MapBehaviour({ listings, fit, onMove }: { listings: ListingCard[]; fit: boolean; onMove?: (b: Bounds) => void }) {
  const map = useMap();
  const key = listings.map((l) => l.id).join(",");

  useEffect(() => {
    const refit = () => {
      map.invalidateSize();
      if (fit && listings.length > 0) {
        map.fitBounds(L.latLngBounds(listings.map((l) => [l.latitude, l.longitude])), { padding: [60, 60], maxZoom: 13 });
      }
    };
    refit();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
    // Refit only when the set of listings changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fit, map]);

  // Only moves the *user* makes (drag, wheel, pinch, zoom buttons) trigger a new search;
  // our own fitBounds and resizes must not.
  useEffect(() => {
    const el = map.getContainer();
    const mark = () => (el.dataset.userMoving = "1");
    // A plain click (e.g. opening a price pin) doesn't count; only real drags and zooms do.
    const markPinch = (e: TouchEvent) => e.touches.length > 1 && mark();
    map.on("dragstart", mark);
    el.addEventListener("wheel", mark, { passive: true });
    el.addEventListener("touchstart", markPinch, { passive: true });
    const onMoveEnd = () => {
      if (el.dataset.userMoving !== "1") return;
      delete el.dataset.userMoving;
      const b = map.getBounds();
      onMove?.({ sw_lat: b.getSouth(), sw_lng: b.getWest(), ne_lat: b.getNorth(), ne_lng: b.getEast() });
    };
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("dragstart", mark);
      el.removeEventListener("wheel", mark);
      el.removeEventListener("touchstart", markPinch);
      map.off("moveend", onMoveEnd);
    };
  }, [map, onMove]);

  return null;
}

/** Airbnb-style map buttons: expand/collapse (top-right) and zoom in/out. */
function MapControls({ expanded, onToggleExpand }: { expanded?: boolean; onToggleExpand?: () => void }) {
  const map = useMap();
  const btn = "grid h-10 w-10 place-items-center bg-white text-[#222] hover:bg-[#f7f7f7]";
  return (
    <div
      className="absolute right-4 top-4 z-[500] flex flex-col gap-3"
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {onToggleExpand && (
        <button aria-label={expanded ? "Show list" : "Expand map"} onClick={onToggleExpand} className={`${btn} hidden rounded-xl shadow-pop lg:grid`}>
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}
      <div className="overflow-hidden rounded-xl shadow-pop">
        <button aria-label="Zoom in" onClick={() => {
            map.getContainer().dataset.userMoving = "1";
            map.zoomIn();
          }} className={`${btn} border-b border-[#ebebeb]`}>
          <Plus size={18} />
        </button>
        <button aria-label="Zoom out" onClick={() => {
            map.getContainer().dataset.userMoving = "1";
            map.zoomOut();
          }} className={btn}>
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ListingsMap({ listings, activeId, onMove, fitToListings, expanded, onToggleExpand }: Props) {
  const center = useMemo<[number, number]>(() => [20.6, 78.9], []); // India

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom className="h-full w-full" zoomControl={false}>
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      <MapBehaviour listings={listings} fit={fitToListings} onMove={onMove} />
      <MapControls expanded={expanded} onToggleExpand={onToggleExpand} />
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
