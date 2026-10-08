import { RequireAuth } from "@/components/auth/RequireAuth";

// Every /host page needs a logged-in host.
export default function HostLayout({ children }: LayoutProps<"/host">) {
  return <RequireAuth host title="Hosting">{children}</RequireAuth>;
}
