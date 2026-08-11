import "server-only";

export interface SignatureInfo {
  name: string | null;
  title: string | null;
  companyName: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Outlook benzeri otomatik imza — logo + isim/unvan + firma adı + telefon + adres. Boş alanlar atlanır. */
export function buildEmailSignatureHtml(info: SignatureInfo): string {
  const nameLine = [info.name, info.title].filter((v): v is string => !!v).map(escapeHtml).join(" — ");
  const lines = [
    nameLine,
    info.companyName ? escapeHtml(info.companyName) : "",
    info.phone ? escapeHtml(info.phone) : "",
    info.address ? escapeHtml(info.address) : "",
  ].filter(Boolean);

  const logo = info.logoUrl
    ? `<img src="${info.logoUrl}" alt="${info.companyName ? escapeHtml(info.companyName) : "Logo"}" style="max-height:56px;max-width:180px;display:block;margin-bottom:8px;" />`
    : "";

  if (!logo && lines.length === 0) return "";

  return `<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:13px;color:#334155;">
${logo}${lines.map((l) => `<div>${l}</div>`).join("\n")}
</div>`;
}

export function buildEmailSignatureText(info: SignatureInfo): string {
  const nameLine = [info.name, info.title].filter(Boolean).join(" — ");
  return [nameLine, info.companyName, info.phone, info.address].filter(Boolean).join("\n");
}
