import { PrivateShell } from "@/components/private-shell";
import { requireCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();

  return <PrivateShell user={user}>{children}</PrivateShell>;
}
