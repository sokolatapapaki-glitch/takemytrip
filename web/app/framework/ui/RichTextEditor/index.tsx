"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, FontFamily } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Pencil } from "lucide-react";
import Toolbar from "./Toolbar";
import LinkHoverOverlay from "./LinkHoverOverlay";
import { ImageWithStyle } from "./ImageNode";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type Props = {
  value?: string;
  editable?: boolean;
  onSave?: (html: string) => void;
  setText?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number | string;
};

export default function RichTextEditor({
  value,
  editable = true,
  onSave,
  setText,
  placeholder,
  className,
  minHeight = 240,
}: Props) {
  const liveMode = editable && !!setText;
  const previewToggleMode = editable && !setText;

  const [isEditing, setIsEditing] = useState(liveMode);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const snapshotRef = useRef<string>(value ?? "");
  const contentBoxRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        link: {
          autolink: true,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      Color,
      Highlight,
      ImageWithStyle.configure({ inline: false, allowBase64: true }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class: "tiptap-content focus:outline-none relative",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (setText) setText(e.getHTML());
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(editable && isEditing);
  }, [editor, editable, isEditing]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const onClick = (e: MouseEvent) => {
      if (isEditing) return;
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;
      if (!link?.href || !wrapper.contains(link)) return;
      e.preventDefault();
      e.stopPropagation();
      window.open(link.href, "_blank", "noopener,noreferrer");
    };
    wrapper.addEventListener("click", onClick, true);
    return () => wrapper.removeEventListener("click", onClick, true);
  }, [isEditing]);

  if (!editor) return null;

  const startEdit = () => {
    snapshotRef.current = editor.getHTML();
    setIsEditing(true);
    setTimeout(() => editor.commands.focus("end"), 0);
  };

  const commitHtmlDraft = () => {
    editor.commands.setContent(htmlDraft);
    if (setText) setText(htmlDraft);
  };

  const handleImagePick = async (file: File) => {
    const src = await readFileAsDataUrl(file);
    editor.chain().focus().setImage({ src, alt: file.name }).run();
  };

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      commitHtmlDraft();
      setIsHtmlMode(false);
    } else {
      setHtmlDraft(editor.getHTML());
      setIsHtmlMode(true);
    }
  };

  const handleSave = () => {
    if (isHtmlMode) {
      commitHtmlDraft();
      setIsHtmlMode(false);
    }
    const html = editor.getHTML();
    snapshotRef.current = html;
    setIsEditing(false);
    onSave?.(html);
  };

  const handleCancel = () => {
    editor.commands.setContent(snapshotRef.current);
    setIsHtmlMode(false);
    setIsEditing(false);
  };

  const showToolbar = liveMode || (previewToggleMode && isEditing);
  const showEditButton = previewToggleMode && !isEditing;
  const showSaveCancel = previewToggleMode && isEditing;
  const chromeOn = showToolbar;
  const contentPadding = chromeOn ? "px-4 py-3" : "px-1 py-2";

  return (
    <>
      <div
        ref={wrapperRef}
        className={`relative rounded-lg flex flex-col ${
          chromeOn
            ? "border border-gray-200 bg-white shadow-sm overflow-hidden"
            : ""
        } ${className ?? ""}`}
      >
        {showToolbar && (
          <Toolbar
            editor={editor}
            onSave={showSaveCancel ? handleSave : undefined}
            onCancel={showSaveCancel ? handleCancel : undefined}
            isHtmlMode={isHtmlMode}
            onToggleHtmlMode={toggleHtmlMode}
            onPickImage={handleImagePick}
          />
        )}
        {showEditButton && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit"
            title="Edit"
            className="absolute top-0 right-0 z-10 inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-200 bg-white/80 backdrop-blur text-gray-700 hover:bg-white shadow-sm"
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>
        )}
        <div
          ref={contentBoxRef}
          className={chromeOn ? "overflow-auto" : ""}
          style={
            chromeOn
              ? {
                  minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
                  ...(userHeight !== null ? { height: `${userHeight}px` } : {}),
                }
              : undefined
          }
        >
          <div className={contentPadding}>
            {isHtmlMode ? (
              <textarea
                value={htmlDraft}
                onChange={(e) => {
                  setHtmlDraft(e.target.value);
                  if (liveMode && setText) setText(e.target.value);
                }}
                spellCheck={false}
                className="w-full min-h-[200px] font-mono text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </div>
        {chromeOn && (
          <div
            role="separator"
            aria-orientation="horizontal"
            title="Drag to resize"
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = contentBoxRef.current?.offsetHeight ?? 0;
              const onMove = (ev: MouseEvent) => {
                const dy = ev.clientY - startY;
                setUserHeight(Math.max(80, startHeight + dy));
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
            className="h-2 cursor-ns-resize bg-gray-50 hover:bg-gray-200 border-t border-gray-200 flex items-center justify-center select-none"
          >
            <div className="w-8 h-0.5 bg-gray-300 rounded" />
          </div>
        )}
      </div>
      {isEditing && <LinkHoverOverlay editor={editor} wrapperRef={wrapperRef} />}
    </>
  );
}
