/** Multi-tenant (pestshield.app, self-registration açık) mi yoksa standalone (pakispco.com.tr,
 * tek kiracılı) dağıtım mı olduğumuzu tespit eder. Paket bazlı lisanslama gibi SADECE
 * multi-tenant'ta anlamlı olan mantık bu fonksiyona bağlanmalıdır. */
export function isMultiTenant(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SELF_REGISTRATION !== "false";
}
