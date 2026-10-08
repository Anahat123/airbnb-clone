import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginPage } from "@/components/auth/LoginPage";
import { Header, HeaderFallback } from "@/components/layout/Header";

export const metadata: Metadata = { title: "Log in or sign up" };

export default function Page() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <Header variant="minimal" wide />
      </Suspense>
      <main>
        <Suspense>
          <LoginPage />
        </Suspense>
      </main>
    </>
  );
}
