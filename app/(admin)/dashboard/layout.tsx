import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/login");
  }

  return <AdminShell userName={session.user.name}>{children}</AdminShell>;
}
