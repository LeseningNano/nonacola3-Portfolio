import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function VideosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/login");
  }

  return children;
}
