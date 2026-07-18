// Basit, bağımlılıksız markdown render'ı — asistan cevaplarındaki
// **kalın**, madde işaretli listeler ve satır sonları için yeterli.
// Tam bir markdown parser'ı gerektirmeyecek kadar sınırlı kullanım alanı
// olduğu için yeni bir paket eklemek yerine küçük bir yardımcı yazıldı.

import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList(key: string) {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="my-1 list-disc pl-4">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      return;
    }
    flushList(`list-${i}`);
    if (line.trim() === "") {
      blocks.push(<div key={`br-${i}`} className="h-1.5" />);
    } else {
      blocks.push(
        <p key={`p-${i}`} className="leading-relaxed">
          {renderInline(line, `p-${i}`)}
        </p>,
      );
    }
  });
  flushList("list-end");

  return <div className="flex flex-col gap-0.5 text-sm">{blocks}</div>;
}
