import { Suspense } from "react";

import { Footer } from "./Footer";
import { Header, HeaderFallback } from "./Header";

/** Header + centred content + footer, used by account-style pages. */
export function PageShell({
  children,
  header = "compact",
  width = "max-w-[1280px]",
  footer = true,
}: {
  children: React.ReactNode;
  header?: "compact" | "minimal";
  width?: string;
  footer?: boolean;
}) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header variant={header} />
      </Suspense>
      <main className={`mx-auto min-h-[60vh] px-6 pb-24 pt-8 md:px-10 xl:px-20 ${width}`}>
        <Suspense>{children}</Suspense>
      </main>
      {footer && <Footer />}
    </>
  );
}
