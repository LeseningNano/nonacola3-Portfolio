import { auth } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api-utils";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  if (session.user.role !== "admin") return forbidden();
  return null;
}
