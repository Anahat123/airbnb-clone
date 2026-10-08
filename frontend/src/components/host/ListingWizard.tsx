"use client";

import clsx from "clsx";
import { Building, Building2, DoorOpen, Hotel, House, Tent, TreePine, Users, Warehouse, Wheat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { LocationMap } from "@/components/map";
import { useToast } from "@/components/providers/ToastProvider";
import { Icon } from "@/components/ui/Icon";
import { Button, Counter, Skeleton, TextField } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import type { ListingDetail, ListingWrite, Meta, RoomType } from "@/lib/types";

import { PhotoUploader } from "./PhotoUploader";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  House: <House size={32} strokeWidth={1.3} />,
  Flat: <Building2 size={32} strokeWidth={1.3} />,
  Villa: <Hotel size={32} strokeWidth={1.3} />,
  Cabin: <TreePine size={32} strokeWidth={1.3} />,
  Cottage: <Warehouse size={32} strokeWidth={1.3} />,
  "Guest house": <Building size={32} strokeWidth={1.3} />,
  "Farm stay": <Wheat size={32} strokeWidth={1.3} />,
  Treehouse: <Tent size={32} strokeWidth={1.3} />,
  Room: <DoorOpen size={32} strokeWidth={1.3} />,
};

// Known city centres so picking a city drops the map pin nearby.
const CITY_CENTRES: Record<string, [number, number, string]> = {
  Goa: [15.55, 73.78, "Goa"],
  Manali: [32.24, 77.19, "Himachal Pradesh"],
  Jaipur: [26.91, 75.79, "Rajasthan"],
  Udaipur: [24.58, 73.69, "Rajasthan"],
  Mumbai: [19.08, 72.85, "Maharashtra"],
  Bengaluru: [12.97, 77.6, "Karnataka"],
  Lonavala: [18.75, 73.41, "Maharashtra"],
  Coorg: [12.42, 75.74, "Karnataka"],
  Rishikesh: [30.12, 78.31, "Uttarakhand"],
  Alappuzha: [9.5, 76.34, "Kerala"],
  Puducherry: [11.93, 79.83, "Puducherry"],
  "New Delhi": [28.61, 77.21, "Delhi"],
  Chandigarh: [30.73, 76.78, "Chandigarh"],
};

const EMPTY: ListingWrite = {
  title: "",
  description: "",
  property_type: "",
  room_type: "entire_home",
  category_id: null,
  address: "",
  city: "",
  state: "",
  country: "India",
  latitude: 20.6,
  longitude: 78.9,
  price_per_night: 3500,
  cleaning_fee: 500,
  max_guests: 4,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  min_nights: 1,
  amenity_ids: [],
  photo_urls: [],
  is_active: true,
};

function fromDetail(l: ListingDetail): ListingWrite {
  return {
    title: l.title,
    description: l.description,
    property_type: l.property_type,
    room_type: l.room_type,
    category_id: l.category?.id ?? null,
    address: l.address,
    city: l.city,
    state: l.state,
    country: l.country,
    latitude: l.latitude,
    longitude: l.longitude,
    price_per_night: l.price_per_night,
    cleaning_fee: l.cleaning_fee,
    max_guests: l.max_guests,
    bedrooms: l.bedrooms,
    beds: l.beds,
    bathrooms: l.bathrooms,
    min_nights: l.min_nights,
    amenity_ids: l.amenities.map((a) => a.id),
    photo_urls: l.photos,
    is_active: l.is_active,
  };
}

type Step = { title: string; subtitle?: string; valid: (f: ListingWrite) => boolean; render: () => React.ReactNode };

/**
 * Airbnb-style step-by-step listing editor. Creating walks through every step; editing
 * uses the same steps but can save from any of them.
 */
export function ListingWizard({ listingId }: { listingId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<ListingWrite>(EMPTY);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loaded, setLoaded] = useState(!listingId);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {});
    if (listingId)
      api
        .hostListing(listingId)
        .then((l) => {
          setForm(fromDetail(l));
          setLoaded(true);
        })
        .catch(() => router.replace("/host/listings"));
  }, [listingId, router]);

  const set = (patch: Partial<ListingWrite>) => setForm((f) => ({ ...f, ...patch }));
  const tile = (on: boolean) =>
    clsx("flex flex-col gap-3 rounded-xl border p-4 text-left font-semibold transition", on ? "border-fg bg-bg-secondary ring-1 ring-fg" : "border-line hover:border-fg");

  if (!meta || !loaded) return <Skeleton className="mx-auto mt-16 h-96 max-w-2xl rounded-2xl" />;

  const steps: Step[] = [
    {
      title: "Which of these best describes your place?",
      valid: (f) => !!f.property_type,
      render: () => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {meta.property_types.map((t) => (
            <button key={t} type="button" className={tile(form.property_type === t)} onClick={() => set({ property_type: t, room_type: t === "Room" ? "private_room" : form.room_type })}>
              {TYPE_ICONS[t]}
              {t}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What type of place will guests have?",
      valid: () => true,
      render: () => (
        <div className="space-y-3">
          {([
            ["entire_home", "An entire place", "Guests have the whole place to themselves.", <House key="h" size={32} strokeWidth={1.3} />],
            ["private_room", "A room", "Guests have their own room in a home, plus access to shared spaces.", <DoorOpen key="d" size={32} strokeWidth={1.3} />],
            ["shared_room", "A shared room", "Guests sleep in a room or common area that may be shared with others.", <Users key="u" size={32} strokeWidth={1.3} />],
          ] as [RoomType, string, string, React.ReactNode][]).map(([v, title, text, icon]) => (
            <button key={v} type="button" onClick={() => set({ room_type: v })} className={clsx(tile(form.room_type === v), "w-full flex-row items-center justify-between p-6")}>
              <span>
                <span className="block text-lg">{title}</span>
                <span className="block text-sm font-normal text-fg-secondary">{text}</span>
              </span>
              {icon}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Where's your place located?",
      subtitle: "Your address is only shared with guests after they've made a reservation. Click the map or drag the pin to set the exact spot.",
      valid: (f) => f.address.trim().length >= 3 && f.city.trim().length >= 2 && f.state.trim().length >= 2,
      render: () => (
        <div className="space-y-4">
          <TextField label="Street address" value={form.address} onChange={(e) => set({ address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <TextField
                label="City"
                list="city-list"
                value={form.city}
                onChange={(e) => {
                  const city = e.target.value;
                  const centre = CITY_CENTRES[city];
                  set(centre ? { city, latitude: centre[0], longitude: centre[1], state: centre[2] } : { city });
                }}
              />
              <datalist id="city-list">
                {Object.keys(CITY_CENTRES).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <TextField label="State" value={form.state} onChange={(e) => set({ state: e.target.value })} />
          </div>
          <div className="h-80 overflow-hidden rounded-2xl">
            <LocationMap lat={form.latitude} lng={form.longitude} zoom={form.city ? 12 : 4} onPick={(latitude, longitude) => set({ latitude, longitude })} />
          </div>
          <p className="text-xs text-fg-secondary">
            Pin: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
          </p>
        </div>
      ),
    },
    {
      title: "Share some basics about your place",
      subtitle: "You'll add more details later, such as bed types.",
      valid: () => true,
      render: () => (
        <div className="divide-y divide-line-light">
          <Counter label="Guests" value={form.max_guests} min={1} max={16} onChange={(n) => set({ max_guests: n })} />
          <Counter label="Bedrooms" value={form.bedrooms} min={0} max={50} onChange={(n) => set({ bedrooms: n })} />
          <Counter label="Beds" value={form.beds} min={1} max={50} onChange={(n) => set({ beds: n })} />
          <Counter label="Bathrooms" value={form.bathrooms} min={0} max={50} onChange={(n) => set({ bathrooms: n })} />
        </div>
      ),
    },
    {
      title: "Tell guests what your place has to offer",
      subtitle: "You can add more amenities after you publish your listing.",
      valid: () => true,
      render: () => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {meta.amenities.map((a) => {
            const on = form.amenity_ids.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className={clsx(tile(on), "text-sm")}
                onClick={() => set({ amenity_ids: on ? form.amenity_ids.filter((x) => x !== a.id) : [...form.amenity_ids, a.id] })}
              >
                <Icon name={a.icon} size={28} />
                {a.name}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "Add some photos of your place",
      subtitle: "You'll need at least one photo to get started. The first one is your cover photo.",
      valid: (f) => f.photo_urls.length > 0,
      render: () => <PhotoUploader photos={form.photo_urls} onChange={(photo_urls) => set({ photo_urls })} />,
    },
    {
      title: "Now, let's give your place a title",
      subtitle: "Short titles work best. Have fun with it — you can always change it later.",
      valid: (f) => f.title.trim().length >= 3,
      render: () => (
        <div className="space-y-8">
          <div>
            <textarea
              value={form.title}
              maxLength={120}
              rows={3}
              onChange={(e) => set({ title: e.target.value })}
              className="w-full rounded-xl border border-line bg-transparent p-4 text-2xl font-semibold outline-none focus:border-fg"
              placeholder="Sunny villa with a pool"
            />
            <p className="mt-1 text-sm font-semibold text-fg-secondary">{form.title.length}/120</p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">Which category fits best?</h3>
            <div className="flex flex-wrap gap-2">
              {meta.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set({ category_id: form.category_id === c.id ? null : c.id })}
                  className={clsx("flex items-center gap-2 rounded-full border px-4 py-2 text-sm", form.category_id === c.id ? "border-fg ring-1 ring-fg" : "border-line hover:border-fg")}
                >
                  <Icon name={c.icon} size={16} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Create your description",
      subtitle: "Share what makes your place special.",
      valid: (f) => f.description.trim().length >= 10,
      render: () => (
        <div>
          <textarea
            value={form.description}
            maxLength={5000}
            rows={10}
            onChange={(e) => set({ description: e.target.value })}
            className="w-full rounded-xl border border-line bg-transparent p-4 text-lg outline-none focus:border-fg"
            placeholder="You'll have a great time at this comfortable place to stay."
          />
          <p className="mt-1 text-sm font-semibold text-fg-secondary">{form.description.length}/5000 · at least 10 characters</p>
        </div>
      ),
    },
    {
      title: "Now, set your price",
      subtitle: "You can change it anytime.",
      valid: (f) => f.price_per_night > 0,
      render: () => (
        <div className="space-y-10">
          <div className="text-center">
            <label className="inline-flex items-baseline text-[64px] font-bold md:text-[88px]">
              ₹
              <input
                type="number"
                min={1}
                aria-label="Price per night"
                value={form.price_per_night || ""}
                onChange={(e) => set({ price_per_night: Math.max(0, Number(e.target.value)) })}
                className="w-[5.5ch] bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
            <p className="text-fg-secondary">per night · guests pay about {money(Math.round(form.price_per_night * 1.26))} incl. fees and taxes</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Cleaning fee (₹)" type="number" min={0} value={form.cleaning_fee} onChange={(e) => set({ cleaning_fee: Math.max(0, Number(e.target.value)) })} />
            <TextField label="Minimum nights" type="number" min={1} max={30} value={form.min_nights} onChange={(e) => set({ min_nights: Math.min(30, Math.max(1, Number(e.target.value))) })} />
          </div>
        </div>
      ),
    },
    {
      title: listingId ? "Review your changes" : "Review your listing",
      subtitle: "Here's what we'll show to guests. Make sure everything looks good.",
      valid: () => true,
      render: () => (
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl shadow-pop">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {form.photo_urls[0] && <img src={form.photo_urls[0]} alt="" className="aspect-[4/3] w-full object-cover" />}
            <div className="p-4">
              <div className="font-semibold">{form.title}</div>
              <div className="text-fg-secondary">
                <strong className="text-fg">{money(form.price_per_night)}</strong> night
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <p>
              <strong>
                {form.property_type} in {form.city}, {form.state}
              </strong>
            </p>
            <p className="text-fg-secondary">
              {form.max_guests} guests · {form.bedrooms} bedrooms · {form.beds} beds · {form.bathrooms} bathrooms
            </p>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line p-4">
              <span>
                <span className="block font-semibold">Listed</span>
                <span className="text-sm text-fg-secondary">Unlisted places don&apos;t appear in search</span>
              </span>
              <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="h-5 w-5 accent-fg" />
            </label>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;
  const allValid = steps.every((s) => s.valid(form));

  async function save() {
    if (!allValid) {
      const bad = steps.findIndex((s) => !s.valid(form));
      setStep(bad);
      toast({ message: "Please complete this step first" });
      return;
    }
    setSaving(true);
    try {
      const saved = listingId ? await api.updateListing(Number(listingId), form) : await api.createListing(form);
      toast({ message: listingId ? "Listing updated" : "Your listing is live! 🎉", image: saved.photos[0] });
      router.push(`/rooms/${saved.id}`);
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Couldn't save listing" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 items-center justify-between px-6 md:px-12">
        <Logo compact />
        <div className="flex gap-2">
          {listingId && (
            <Button variant="outline" className="!rounded-full" loading={saving} onClick={save}>
              Save
            </Button>
          )}
          <Link href="/host/listings" className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-fg">
            Exit
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 pb-40 pt-6">
        <p className="mb-2 text-sm font-semibold text-fg-secondary">
          Step {step + 1} of {steps.length}
        </p>
        <h1 className="text-[28px] font-semibold leading-tight md:text-[32px]">{current.title}</h1>
        {current.subtitle && <p className="mt-2 text-fg-secondary">{current.subtitle}</p>}
        <div className="mt-8">{current.render()}</div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-50 bg-bg">
        <div className="grid h-1.5 gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
          {steps.map((_, i) => (
            <div key={i} className="bg-line-light">
              <div className={clsx("h-full bg-fg transition-all duration-300", i <= step ? "w-full" : "w-0")} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 py-4 md:px-12">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="rounded-lg px-2 py-2 font-semibold underline disabled:invisible"
          >
            Back
          </button>
          {last ? (
            <Button size="lg" variant="primary" loading={saving} onClick={save}>
              {listingId ? "Save changes" : "Publish listing"}
            </Button>
          ) : (
            <Button size="lg" disabled={!current.valid(form)} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
