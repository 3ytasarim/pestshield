import { auth } from "@/auth";
import { TechHomeClient } from "@/components/tech/tech-home-client";
import { getAllWorkOrders, getCustomerById } from "@/lib/mock/crm";

export default async function TechDashboardPage() {
  const session = await auth();
  const techName = session?.user?.name ?? "";

  const myOrders = getAllWorkOrders()
    .filter((o) => o.technician === techName)
    .map((o) => ({ ...o, customer: getCustomerById(o.customerId) }));

  return <TechHomeClient userName={techName} orders={myOrders} />;
}
