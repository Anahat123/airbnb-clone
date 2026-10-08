/** Shown when the backend can't be reached (e.g. a free-tier server waking up). */
export function ApiOffline() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-5xl">🏝️</p>
      <h2 className="mt-4 text-xl font-semibold">We can&apos;t reach our servers right now</h2>
      <p className="mt-2 text-fg-secondary">
        The API may be waking up (free hosting sleeps when idle). Give it about 30 seconds, then refresh the page.
      </p>
    </div>
  );
}
