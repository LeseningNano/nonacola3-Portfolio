import { redirect } from "next/navigation";

export default function LegacyNewWorkPage() {
  redirect("/dashboard/works/new");
}
