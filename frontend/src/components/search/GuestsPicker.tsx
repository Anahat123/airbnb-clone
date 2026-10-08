"use client";

import { Counter } from "@/components/ui/primitives";
import type { Guests } from "@/lib/search";

export function GuestsPicker({
  value,
  onChange,
  maxGuests = 16,
  allowPets = true,
}: {
  value: Guests;
  onChange: (g: Guests) => void;
  maxGuests?: number;
  allowPets?: boolean;
}) {
  const total = value.adults + value.children;
  const set = (key: keyof Guests) => (n: number) => {
    const next = { ...value, [key]: n };
    // Children, infants or pets need at least one adult, like on Airbnb.
    if (key !== "adults" && n > 0 && next.adults === 0) next.adults = 1;
    onChange(next);
  };

  return (
    <div className="divide-y divide-line-light">
      <Counter label="Adults" hint="Ages 13 or above" value={value.adults} max={maxGuests - value.children} onChange={set("adults")}
        min={value.children || value.infants || value.pets ? 1 : 0} />
      <Counter label="Children" hint="Ages 2–12" value={value.children} max={maxGuests - value.adults} onChange={set("children")} />
      <Counter label="Infants" hint="Under 2" value={value.infants} max={5} onChange={set("infants")} />
      <Counter
        label="Pets"
        hint={allowPets ? <span className="underline">Bringing a service animal?</span> : "This place doesn't allow pets"}
        value={value.pets}
        max={allowPets ? 5 : 0}
        onChange={set("pets")}
      />
      {total >= maxGuests && maxGuests < 16 && (
        <p className="pt-4 text-sm text-fg-secondary">
          This place has a maximum of {maxGuests} guests, not including infants.
        </p>
      )}
    </div>
  );
}
