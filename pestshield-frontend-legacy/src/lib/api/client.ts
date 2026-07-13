import axios from "axios";
import { supabase } from "@/lib/supabase/client";

/**
 * ipm-backend (NestJS) REST API için axios instance.
 * Login/signup burada YOK (bkz. lib/supabase/client.ts) — bu client
 * sadece kimliği doğrulanmış kullanıcının backend'e yaptığı çağrılar
 * içindir (örn. /users/me, /devices, /activity-logs).
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// İstek interceptor'ı: geçerli Supabase session'ından access token'ı
// alıp Authorization header'ına ekler. Token yenileme (refresh) Supabase
// SDK tarafından arka planda otomatik yapıldığı için burada her zaman
// güncel bir token bulunur.
apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Yanıt interceptor'ı: 401 (geçersiz/süresi dolmuş token) durumunda
// oturumu kapatıp login sayfasına yönlendirir.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
