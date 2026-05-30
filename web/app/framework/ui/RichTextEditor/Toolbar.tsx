"use client";

import { useRef } from "react";
import { type Editor } from "@tiptap/react";
import { useApp } from "@/framework/ui/context/AppContext";
import { ToolbarButton, Divider } from "./ToolbarButton";
import LinkDialog from "./LinkDialog";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Highlighter,
  Check,
  X as XIcon,
  Code2,
  ImagePlus,
} from "lucide-react";

const normalizeHref = (raw: string): string => {
  const href = raw.trim();
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|ftp:|\/|#)/i.test(href)) return href;
  return `https://${href}`;
};

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Sans serif", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', ui-monospace, monospace" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Comic Sans", value: "'Comic Sans MS', cursive" },
];

export default function Toolbar({
  editor,
  onSave,
  onCancel,
  isHtmlMode = false,
  onToggleHtmlMode,
  onPickImage,
}: {
  editor: Editor;
  onSave?: () => void;
  onCancel?: () => void;
  isHtmlMode?: boolean;
  onToggleHtmlMode?: () => void;
  onPickImage?: (file: File) => void;
}) {
  const { openModal, closeModal } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file || !onPickImage) return;
    onPickImage(file);
  };

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
    ? "h3"
    : "p";

  const currentFont = (editor.getAttributes("textStyle").fontFamily as string) ?? "";

  const setHeading = (v: string) => {
    if (v === "p") editor.chain().focus().setParagraph().run();
    else
      editor
        .chain()
        .focus()
        .toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 })
        .run();
  };

  const setFont = (v: string) => {
    if (v === "") editor.chain().focus().unsetFontFamily().run();
    else editor.chain().focus().setFontFamily(v).run();
  };

  const openLinkModal = () => {
    const { from, to, empty } = editor.state.selection;
    const inLink = editor.isActive("link");
    const currentHref = (editor.getAttributes("link").href as string) ?? "";

    let initialLabel = "";
    let labelFrom = from;
    let labelTo = to;

    if (inLink) {
      const $pos = editor.state.doc.resolve(from);
      const linkMark = $pos.marks().find((m) => m.type.name === "link");
      if (linkMark) {
        let start = from;
        let end = to;
        while (start > 0 && editor.state.doc.rangeHasMark(start - 1, start, linkMark.type)) start--;
        while (
          end < editor.state.doc.content.size &&
          editor.state.doc.rangeHasMark(end, end + 1, linkMark.type)
        )
          end++;
        labelFrom = start;
        labelTo = end;
        initialLabel = editor.state.doc.textBetween(start, end, " ");
      }
    } else if (!empty) {
      initialLabel = editor.state.doc.textBetween(from, to, " ");
    }

    openModal(
      <LinkDialog
        initialLabel={initialLabel}
        initialHref={currentHref}
        onCancel={closeModal}
        onSave={(label, rawHref) => {
          const href = normalizeHref(rawHref);
          const text = label || href;
          const linkNode = {
            type: "text" as const,
            text,
            marks: [{ type: "link", attrs: { href } }],
          };

          if (inLink) {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: labelFrom, to: labelTo })
              .deleteSelection()
              .insertContent(linkNode)
              .run();
          } else if (!empty) {
            if (label && label !== initialLabel) {
              editor
                .chain()
                .focus()
                .deleteRange({ from, to })
                .insertContent(linkNode)
                .run();
            } else {
              editor
                .chain()
                .focus()
                .setTextSelection({ from, to })
                .setLink({ href })
                .run();
            }
          } else {
            editor.chain().focus().insertContent(linkNode).run();
          }

          closeModal();
        }}
      />,
      "Insert link"
    );
  };

  if (isHtmlMode) {
    return (
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-white">
        {onToggleHtmlMode && (
          <ToolbarButton onClick={onToggleHtmlMode} active label="Exit HTML mode">
            <Code2 size={16} />
          </ToolbarButton>
        )}
        <span className="ml-2 text-xs text-gray-500">HTML source</span>

        {(onSave || onCancel) && (
          <div className="ml-auto flex items-center gap-1.5 pl-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-8 px-2.5 inline-flex items-center gap-1 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <XIcon size={14} />
                <span>Cancel</span>
              </button>
            )}
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="h-8 px-2.5 inline-flex items-center gap-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                <Check size={14} />
                <span>Save</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-white">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Undo"
      >
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Redo"
      >
        <Redo2 size={16} />
      </ToolbarButton>

      <Divider />

      <select
        value={currentFont}
        onChange={(e) => setFont(e.target.value)}
        className="h-8 text-sm border border-gray-200 rounded px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 max-w-[8rem]"
        aria-label="Font family"
        style={{ fontFamily: currentFont || undefined }}
      >
        {FONT_OPTIONS.map((opt) => (
          <option key={opt.label} value={opt.value} style={{ fontFamily: opt.value || undefined }}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={currentHeading}
        onChange={(e) => setHeading(e.target.value)}
        className="h-8 text-sm border border-gray-200 rounded px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Text style"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        label="Underline"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <Divider />

      <label
        className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer text-gray-700"
        title="Text color"
      >
        <span className="text-xs font-bold leading-none">A</span>
        <span
          className="absolute bottom-1 left-1.5 right-1.5 h-0.5"
          style={{
            backgroundColor:
              (editor.getAttributes("textStyle").color as string) ?? "#000000",
          }}
        />
        <input
          type="color"
          value={(editor.getAttributes("textStyle").color as string) ?? "#000000"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Pick text color"
        />
      </label>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive("highlight")}
        label="Highlight"
      >
        <Highlighter size={16} />
      </ToolbarButton>

      <Divider />

      {(() => {
        const imageSelected = editor.isActive("image");
        const imageAlign = imageSelected
          ? ((editor.getAttributes("image").align as string | null) ?? null)
          : null;
        const setAlign = (next: "left" | "center" | "right") => {
          if (imageSelected) {
            editor.chain().focus().updateAttributes("image", { align: next }).run();
          } else {
            editor.chain().focus().setTextAlign(next).run();
          }
        };
        const isAlignActive = (dir: "left" | "center" | "right") =>
          imageSelected ? imageAlign === dir : editor.isActive({ textAlign: dir });
        return (
          <>
            <ToolbarButton
              onClick={() => setAlign("left")}
              active={isAlignActive("left")}
              label={imageSelected ? "Align image left" : "Align left"}
            >
              <AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setAlign("center")}
              active={isAlignActive("center")}
              label={imageSelected ? "Align image center" : "Align center"}
            >
              <AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setAlign("right")}
              active={isAlignActive("right")}
              label={imageSelected ? "Align image right" : "Align right"}
            >
              <AlignRight size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              active={!imageSelected && editor.isActive({ textAlign: "justify" })}
              disabled={imageSelected}
              label="Justify"
            >
              <AlignJustify size={16} />
            </ToolbarButton>
          </>
        );
      })()}

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bullet list"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Numbered list"
      >
        <ListOrdered size={16} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Quote"
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        label="Code block"
      >
        <Code size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Horizontal rule"
      >
        <Minus size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={openLinkModal} active={editor.isActive("link")} label="Link">
        <LinkIcon size={16} />
      </ToolbarButton>
      {onPickImage && (
        <>
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            label="Insert image"
          >
            <ImagePlus size={16} />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            className="hidden"
          />
        </>
      )}
      {onToggleHtmlMode && (
        <ToolbarButton onClick={onToggleHtmlMode} label="Edit HTML">
          <Code2 size={16} />
        </ToolbarButton>
      )}

      {(onSave || onCancel) && (
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-8 px-2.5 inline-flex items-center gap-1 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <XIcon size={14} />
              <span>Cancel</span>
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="h-8 px-2.5 inline-flex items-center gap-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              <Check size={14} />
              <span>Save</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
