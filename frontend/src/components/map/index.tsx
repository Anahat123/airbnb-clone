"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import, so the maps only load in the browser.
const loading = () => <div className="skeleton h-full w-full" />;

export const ListingsMap = dynamic(() => import("./ListingsMap"), { ssr: false, loading });
export const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false, loading });
export type { Bounds } from "./ListingsMap";
