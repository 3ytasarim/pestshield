import type { NextRequest } from "next/server";

// Gecici tani: Statik `import { handlers } from "@/auth"` derleme anindan
// once calisiyor ve try/catch ile sarilamiyor - eger hata "@/auth" modulunun
// (veya onun bagimliliklarinin) kendi ust-seviye degerlendirmesi sirasinda
// olusuyorsa, statik import bunu hic yakalayamaz. Dinamik `import()` ise bir
// Promise dondurur ve modul degerlendirme hatalarini da reddeder (reject) -
// boylece burada yakalayabiliriz.
export async function GET(req: NextRequest) {
  try {
    const { handlers } = await import("@/auth");
    return await handlers.GET(req);
  } catch (err) {
    console.error("[AUTH-ROUTE-GET-HATA]", err);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { handlers } = await import("@/auth");
    return await handlers.POST(req);
  } catch (err) {
    console.error("[AUTH-ROUTE-POST-HATA]", err);
    throw err;
  }
}
