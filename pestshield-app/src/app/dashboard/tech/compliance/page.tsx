import { auth } from "@/auth";
import { TechCompliancePage } from "@/components/tech/tech-compliance-page";

export default async function Page() {
  const session = await auth();

  return <TechCompliancePage technicianName={session?.user?.name ?? "Teknisyen"} />;
}
