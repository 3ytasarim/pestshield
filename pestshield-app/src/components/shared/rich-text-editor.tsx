"use client";

import { useRef, type ComponentType } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Bold, Italic, ImageIcon, List, ListOrdered, Redo, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Yazmaya başlayın...", minHeightClassName = "min-h-[160px]" }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({ HTMLAttributes: { class: "max-w-full rounded-lg" } }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "max-w-none px-3 py-2.5 text-sm text-foreground focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
          "[&_strong]:font-semibold [&_em]:italic [&_p]:my-1.5 [&_img]:my-2",
          minHeightClassName,
        ),
        "data-placeholder": placeholder,
      },
    },
  });

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    try {
      const dataUrl = await readImageFile(file, 3);
      editor.chain().focus().setImage({ src: dataUrl }).run();
    } catch {
      // 3MB üstü görsel sessizce reddedilir - kullanıcı daha küçük bir dosya seçip tekrar dener.
    }
  }

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/30 p-1.5">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} label="Kalın" />
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} label="İtalik" />
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} label="Madde İşaretli Liste" />
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} label="Numaralı Liste" />
        <ToolbarButton active={false} onClick={() => fileInputRef.current?.click()} icon={ImageIcon} label="Görsel Ekle" />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton active={false} onClick={() => editor.chain().focus().undo().run()} icon={Undo} label="Geri Al" />
        <ToolbarButton active={false} onClick={() => editor.chain().focus().redo().run()} icon={Redo} label="Yinele" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("size-7 p-0", active && "bg-muted text-foreground")}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}
