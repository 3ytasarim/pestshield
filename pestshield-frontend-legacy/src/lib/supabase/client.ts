import { createBrowserClient } from "@supabase/ssr";

/**
 * Tarayıcı tarafı Supabase client'ı. Login/signup/logout ve session
 * (JWT) yönetimi tamamen bu client üzerinden yapılır - SDK, access ve
 * refresh token'ı kendi içinde (varsayılan: localStorage) saklar ve
 * süresi dolmadan otomatik yeniler. Kendi elimizle token yazmamıza
 * gerek yok.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export const supabase = createClient();
