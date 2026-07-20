import { handlers } from "@/auth";

// Gecici tani: Next.js'in hata formatlayicisi "open EEXIST" hatasinin tam
// stack trace'ini bastiriyor. handlers.GET/POST'u sarip ham hatayi
// stderr'a yaziyoruz.
export async function GET(req: Request) {
  try {
    return await handlers.GET(req);
  } catch (err) {
    console.error("[AUTH-ROUTE-GET-HATA]", err);
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    return await handlers.POST(req);
  } catch (err) {
    console.error("[AUTH-ROUTE-POST-HATA]", err);
    throw err;
  }
}
