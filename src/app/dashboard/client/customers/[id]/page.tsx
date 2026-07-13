import { getCustomerById } from "@/lib/mock/crm";
import { CustomerDetailPage } from "@/components/crm/detail/customer-detail-page";
import { CustomerDetailClient } from "@/components/crm/detail/customer-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CustomerDetailRoute({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const customer = getCustomerById(id);

  if (customer) {
    return <CustomerDetailPage customer={customer} initialTab={tab ?? "overview"} />;
  }

  // Statik tohum veride bulunamadı — tarayıcıda oluşturulmuş (yalnızca
  // localStorage'da yaşayan) bir müşteri olabilir; istemci tarafında dene.
  return <CustomerDetailClient id={id} initialTab={tab ?? "overview"} />;
}
