// Original travel-poster tiles drawn with CSS/SVG (no Airbnb artwork), used behind the /login card.

type Scene = "beach" | "mountain" | "desert" | "city" | "lake" | "jungle";

const POSTERS: { city: string; scene: Scene; sky: string; ground: string; sun: string; ink: string }[] = [
  { city: "GOA", scene: "beach", sky: "#ffb38a", ground: "#2fa3a8", sun: "#ffe6a3", ink: "#14365c" },
  { city: "JAIPUR", scene: "desert", sky: "#f7a8b8", ground: "#d9654b", sun: "#ffd27a", ink: "#5a1e3a" },
  { city: "MANALI", scene: "mountain", sky: "#9fc7ef", ground: "#3f7d5a", sun: "#fff3c4", ink: "#1d3b5c" },
  { city: "MUMBAI", scene: "city", sky: "#ffcf7a", ground: "#3a4f8f", sun: "#ff7a59", ink: "#1b2340" },
  { city: "UDAIPUR", scene: "lake", sky: "#c9b6f2", ground: "#5aa0c8", sun: "#ffe3a3", ink: "#3b2a6b" },
  { city: "COORG", scene: "jungle", sky: "#bfe6b8", ground: "#2e7d4f", sun: "#fff1a8", ink: "#1f4430" },
  { city: "KERALA", scene: "lake", sky: "#ffd9a8", ground: "#2f8f86", sun: "#ff9f6e", ink: "#14403c" },
  { city: "RISHIKESH", scene: "mountain", sky: "#ffc4a3", ground: "#4f7f6a", sun: "#fff0b3", ink: "#3c2a22" },
  { city: "PUDUCHERRY", scene: "beach", sky: "#a8dcf0", ground: "#e8b04f", sun: "#ffffff", ink: "#1d4a6b" },
  { city: "LONAVALA", scene: "jungle", sky: "#d4c2f2", ground: "#4e8a55", sun: "#ffe7a8", ink: "#2b2450" },
  { city: "BENGALURU", scene: "city", sky: "#b8e3d4", ground: "#356f8f", sun: "#ffd166", ink: "#173a4a" },
  { city: "LEH", scene: "mountain", sky: "#ffd0dc", ground: "#8a6d9c", sun: "#fff4d1", ink: "#3d2445" },
];

function SceneShapes({ scene, ground, sun }: { scene: Scene; ground: string; sun: string }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <circle cx="70" cy="34" r="13" fill={sun} />
      {scene === "mountain" && (
        <>
          <path d="M0 78 L25 40 L45 66 L65 30 L100 74 L100 100 L0 100Z" fill={ground} />
          <path d="M65 30 L72 41 L58 41Z M25 40 L31 49 L19 49Z" fill="#ffffff" opacity="0.85" />
        </>
      )}
      {scene === "beach" && (
        <>
          <path d="M0 70 Q25 64 50 70 T100 70 L100 100 L0 100Z" fill={ground} />
          <path d="M0 84 Q30 78 60 84 T100 82 L100 100 L0 100Z" fill="#f3d9a4" />
          <path d="M18 84 Q20 62 24 52" stroke="#5b3a1e" strokeWidth="1.6" fill="none" />
          <path d="M24 52 q-9 0 -13 6 M24 52 q8 -2 13 4 M24 52 q-3 -7 -10 -8 M24 52 q4 -7 11 -6" stroke="#2f7d4a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {scene === "desert" && (
        <>
          <path d="M0 76 Q30 66 60 74 T100 72 L100 100 L0 100Z" fill={ground} />
          <path d="M30 76 L30 58 Q38 48 46 58 L46 76Z M52 76 L52 54 L66 54 L66 76Z" fill="#fff0e0" opacity="0.9" />
        </>
      )}
      {scene === "city" && (
        <>
          <path d="M0 100 L0 64 L10 64 L10 52 L20 52 L20 70 L30 70 L30 44 L40 44 L40 62 L52 62 L52 38 L60 38 L60 66 L72 66 L72 50 L84 50 L84 70 L100 70 L100 100Z" fill={ground} />
          <path d="M0 86 L100 86 L100 100 L0 100Z" fill="#000000" opacity="0.15" />
        </>
      )}
      {scene === "lake" && (
        <>
          <path d="M0 64 L20 52 L40 62 L62 48 L100 60 L100 72 L0 72Z" fill="#00000022" />
          <rect x="0" y="72" width="100" height="28" fill={ground} />
          <path d="M10 80 H40 M55 88 H90 M20 94 H50" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
        </>
      )}
      {scene === "jungle" && (
        <>
          <path d="M0 100 L0 66 Q12 50 24 66 Q36 48 50 64 Q64 46 78 64 Q90 52 100 62 L100 100Z" fill={ground} />
          <path d="M0 100 L0 80 Q20 70 40 80 Q60 70 80 80 Q92 74 100 80 L100 100Z" fill="#000000" opacity="0.18" />
        </>
      )}
    </svg>
  );
}

/** A dimmed wall of poster tiles, filling the screen behind the login card. */
export function PosterWall() {
  const tiles = [...POSTERS, ...POSTERS.slice(0, 6)];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="grid -translate-x-10 -translate-y-6 grid-cols-3 gap-6 p-6 sm:grid-cols-4 lg:grid-cols-6">
        {tiles.map((p, i) => (
          <div
            key={i}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg"
            style={{ background: p.sky, transform: `translateY(${i % 2 ? 40 : 0}px)` }}
          >
            <SceneShapes scene={p.scene} ground={p.ground} sun={p.sun} />
            <span
              className="absolute inset-x-0 top-[12%] text-center text-[clamp(18px,2.6vw,40px)] font-black tracking-tight"
              style={{ color: p.ink }}
            >
              {p.city}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
    </div>
  );
}
