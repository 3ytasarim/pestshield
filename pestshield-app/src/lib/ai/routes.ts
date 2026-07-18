// PestShield AI Command Center — güvenilir navigasyon hedefleri.
//
// Model hiçbir zaman bir URL üretmez/döndürmez — tool sonuçlarındaki
// navigasyon aksiyonları SADECE bu sabit, uygulama kodu tarafından
// üretilen route'ları kullanır. Bu proje genelinde merkezi bir route
// sabitleri dosyası bulunmadığı için (nav-config.ts sidebar linklerini
// kendi içinde string literal olarak tutar — aynı yerleşik konvansiyon),
// bu dosya AI özelliği için aynı deseni izler.

export const AI_ROUTES = {
  services: () => "/dashboard/client/hizmetler",
  collections: () => "/dashboard/client/collections",
  customers: () => "/dashboard/client/customers",
  customerDetail: (customerId: string) => `/dashboard/client/customers/${customerId}`,
  contracts: () => "/dashboard/client/contracts",
  riskManagement: () => "/dashboard/client/risk-management",
  correctiveActions: () => "/dashboard/client/corrective-actions",
  servicePlanning: () => "/dashboard/client/service-planning",
  technicians: () => "/dashboard/client/technicians",
  reports: () => "/dashboard/client/reports/operations",
} as const;
