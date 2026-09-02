import { auth } from "@/auth";
import { TechServicesPage } from "@/components/tech/tech-services-page";

export default async function Page() {
  const session = await auth();

  return <TechServicesPage technicianName={session?.user?.name ?? "Teknisyen"} />;
}
