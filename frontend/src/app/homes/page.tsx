import type { Metadata } from "next";

import { HomePage } from "@/components/home/HomePage";

export const metadata: Metadata = { title: "Homes" };

// "Homes" tab: homes grouped by category (pools, cabins, beachfront, ...).
export default function Page() {
  return <HomePage group="category" />;
}
