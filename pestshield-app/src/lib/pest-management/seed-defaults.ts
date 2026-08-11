import "server-only";
import { prisma } from "@/lib/db";
import { pestSpecies, equipmentGuides } from "@/lib/mock/pest-management";

/** Feromon rehberinin eski sabit bilgi kartından (PheromoneInfoCard) taşınan içeriği — artık düzenlenebilir bir rehber kaydı olarak tohumlanır. */
const PHEROMONE_GUIDE_CONTENT_HTML = `
<p>Feromon tuzakları tarım, ormancılık ve depolama alanlarında güve haricindeki sinekler, kınkanatlı böcekler, thripsler ve kabuklu bitler gibi çok sayıda farklı zararlı türünün biyoteknik mücadelesinde aktif olarak kullanılmaktadır. Güve (Lepidoptera) takımı dışındaki en yaygın kullanım alanları ve hedef zararlı türleri şunlardır:</p>
<p><strong>🪰 Sinekler ve İki Kanatlılar (Diptera)</strong></p>
<p>Meyve yetiştiriciliğinde büyük ekonomik kayıplara yol açan sinek türlerinin hem popülasyon takibinde hem de kitlesel yakalanmasında eşeysel veya beslemsel feromonlar yoğun şekilde tercih edilir.</p>
<ul>
<li>Akdeniz Meyve Sineği (Ceratitis capitata)</li>
<li>Zeytin Sineği (Bactrocera oleae)</li>
<li>Kiraz Sineği (Rhagoletis cerasi)</li>
</ul>
<p><strong>🪲 Kınkanatlılar ve Coleoptera Takımı</strong></p>
<p>Orman alanlarına zarar veren kabuk böcekleri ile depolanmış tahıl zararlılarına karşı feromon kullanımı, orman ekosistemini korumada ve kimyasal ilaçlamayı azaltmada temel yöntemlerden biridir.</p>
<ul>
<li>Orman Kabuk Böcekleri (Örn: Ips sexdentatus, Ips typographus)</li>
<li>Kırmızı Palmiye Böceği (Rhynchophorus ferrugineus)</li>
<li>Ekin Kambur Böceği (Zabrus spp.)</li>
<li>Un Bitleri ve Tel Kurtları</li>
</ul>
<p><strong>🪵 Yarım Kanatlılar ve Thripsler (Hemiptera &amp; Thysanoptera)</strong></p>
<p>Bitki özsuyunu emerek beslenen ve virüs taşıyıcılığı yapan emici zararlıların kontrolünde feromon kombinasyonları etkilidir.</p>
<ul>
<li>Thrips Türleri (Örn: Çiçek thripsi — Frankliniella occidentalis)</li>
<li>Unlu Bitler ve Koşniller (Örn: Turunçgil unlu biti — Planococcus citri)</li>
<li>Kahverengi Kokarca Böceği (Halyomorpha halys)</li>
</ul>
<p><strong>🐝 Zarsı Kanatlılar (Hymenoptera)</strong></p>
<p>Testereli Arılar: Özellikle meyve ağaçlarının çiçek ve sürgün dönemlerine zarar veren arı türlerinin tuzaklanmasında kullanılır.</p>
`.trim();

/**
 * Bir firmanın Zararlı Türleri/Ekipman Rehberi kataloğunda hiç kayıt yoksa, sistemin varsayılan
 * setini o firmaya özel, tamamen düzenlenebilir kopyalar olarak bir kereye mahsus tohumlar.
 *
 * Kasıtlı olarak `$transaction` KULLANILMAZ: Supabase transaction-pooler (pgbouncer, port 6543)
 * çok adımlı interaktif transaction'ları desteklemiyor ("Transaction not found" / P2028 hatası —
 * DDL'de yaşanan aynı köken). Sıralı, transaction'sız create'ler burada güvenli bir ödün: bu
 * sadece ilk-yükleme kolaylığı, ortasında kesilirse firma eksik kalan kayıtları kendisi
 * tamamlayabilir (silme/ekleme zaten serbest).
 */
export async function ensurePestManagementSeeded(ownerId: string): Promise<void> {
  const existing = await prisma.pestSpeciesEntry.count({ where: { ownerId } });
  if (existing > 0) return;

  const idMap = new Map<string, string>();
  for (const s of pestSpecies) {
    const created = await prisma.pestSpeciesEntry.create({
      data: {
        ownerId,
        name: s.name,
        scientificName: s.scientificName,
        category: s.category,
        riskLevel: s.riskLevel,
        activeSeason: s.activeSeason,
        icon: s.icon,
        contentHtml: `<p>${s.description}</p><p><strong>Kontrol Yöntemi:</strong> ${s.controlMethod}</p>`,
      },
      select: { id: true },
    });
    idMap.set(s.id, created.id);
  }

  for (const g of equipmentGuides) {
    const connectIds = g.targetSpeciesIds.map((id) => idMap.get(id)).filter((id): id is string => !!id);
    await prisma.equipmentGuideEntry.create({
      data: {
        ownerId,
        category: g.category,
        title: g.title,
        contentHtml: `<p>${g.description}</p><p><strong>Kullanım Notu:</strong> ${g.usageNote}</p>`,
        relatedProductKeywords: g.relatedProductNameContains,
        ...(connectIds.length > 0 ? { targetSpecies: { connect: connectIds.map((id) => ({ id })) } } : {}),
      },
    });
  }

  const unKurduId = idMap.get("pest-008");
  await prisma.equipmentGuideEntry.create({
    data: {
      ownerId,
      category: "pheromone",
      title: "Feromon Kullanım Rehberi — Hedef Zararlı Türleri",
      contentHtml: PHEROMONE_GUIDE_CONTENT_HTML,
      relatedProductKeywords: [],
      ...(unKurduId ? { targetSpecies: { connect: [{ id: unKurduId }] } } : {}),
    },
  });
}
