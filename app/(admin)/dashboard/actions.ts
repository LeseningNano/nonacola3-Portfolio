"use server";

import { signOut } from "@/lib/auth";

export async function logoutAdmin() {
  await signOut({ redirectTo: "/login" });
}
