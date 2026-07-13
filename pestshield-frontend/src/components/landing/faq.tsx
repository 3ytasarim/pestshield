"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/landing/motion/scroll-reveal";

const FAQS = [
  {
    question: "Demo lisansı nasıl işliyor?",
    answer:
      "Firma kaydınız onaylandıktan sonra size 5 günlük bir demo lisans anahtarı tanımlanır. Giriş yaptıktan sonra bu anahtarı aktive ederek tüm özellikleri deneyebilirsiniz.",
  },
  {
    question: "Saha personelim uygulamayı nasıl kullanır?",
    answer:
      "Saha personeli mobil tarayıcıdan giriş yapar, cihazın üzerindeki QR kodu okutur ve kontrol formunu doldurur. Ekstra bir uygulama kurulumu gerekmez.",
  },
  {
    question: "BRCGS/HACCP denetimlerinde nasıl yardımcı olur?",
    answer:
      "Her kontrol zaman damgası, fotoğraf ve imza ile kaydedilir. Denetim sırasında tek tıkla uyumlu PDF raporu oluşturabilirsiniz.",
  },
  {
    question: "Firmam birden fazla çalışan ekleyebilir mi?",
    answer:
      "Evet. Firma sahibi, panelden sınırsız sayıda çalışan hesabı oluşturup rollerini yönetebilir.",
  },
  {
    question: "Lisans süresi dolarsa ne olur?",
    answer:
      "Süre dolduğunda cihaz ve kontrol kayıtlarına erişim geçici olarak kilitlenir. Yeni bir lisans anahtarı aktive ettiğinizde kaldığınız yerden devam edersiniz - verileriniz kaybolmaz.",
  },
];

export function Faq() {
  return (
    <section id="sss" className="mx-auto max-w-3xl px-6 py-24">
      <ScrollReveal className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Sıkça Sorulan Sorular
        </h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Accordion className="w-full">
          {FAQS.map((faq, index) => (
            <AccordionItem key={faq.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>
    </section>
  );
}
