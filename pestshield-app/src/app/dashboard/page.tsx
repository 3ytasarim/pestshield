import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardPathForRole } from "@/lib/dashboard-path";

/** /dashboard'a doğrudan gelen istekleri role göre doğru sayfaya yönlendirir. */
export default async function DashboardIndexPage() {
  const session = await auth();
  redirect(getDashboardPathForRole(session!.user.role));
}
