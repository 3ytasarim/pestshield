// Seçilen görsel dosyayı base64 data URL'e çevirir — gerçek bir dosya
// depolama/backend olmadığı için küçük görseller (logo vb.) tarayıcıda
// bu şekilde saklanır.
export function readImageFile(file: File, maxSizeMB = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      reject(new Error(`Görsel dosyası ${maxSizeMB}MB'dan küçük olmalı`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Görsel okunamadı"));
    reader.readAsDataURL(file);
  });
}
