"use client";

import L from "leaflet";
import { House } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import { ATTRIBUTION, TILES } from "./tiles";

const homeIcon = L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#222;color:#fff;transform:translate(-50%,-50%);box-shadow:0 0 0 8px rgb(255 56 92 / .2)">${renderToStaticMarkup(<House size={22} />)}</span>`,
  iconSize: [0, 0],
});

function ClickToMove({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/**
 * "Where you'll be" map on the listing page (approximate area circle), and the
 * draggable pin used by hosts when creating a listing.
 */
export default function LocationMap({
  lat,
  lng,
  zoom = 13,
  approximate = false,
  onPick,
}: {
  lat: number;
  lng: number;
  zoom?: number;
  approximate?: boolean;
  onPick?: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer key={onPick ? undefined : `${lat},${lng}`} center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      {approximate ? (
        <Circle center={[lat, lng]} radius={600} pathOptions={{ color: "#ff385c", fillColor: "#ff385c", fillOpacity: 0.15, weight: 0 }} />
      ) : null}
      <Marker
        position={[lat, lng]}
        icon={homeIcon}
        draggable={!!onPick}
        eventHandlers={onPick ? { dragend: (e) => { const p = e.target.getLatLng(); onPick(p.lat, p.lng); } } : undefined}
      />
      {onPick && <ClickToMove onPick={onPick} />}
    </MapContainer>
  );
}
