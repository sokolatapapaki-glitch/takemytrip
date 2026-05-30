"use client";

import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  applyImageStyle,
  DEFAULT_IMAGE_STYLE,
  useImageStyleModal,
  type StyleValues,
} from "@/framework/data/image/ImageStyleSettings";

function parseStyleData(raw: unknown): StyleValues | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as StyleValues;
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as StyleValues;
  } catch {
    return null;
  }
}

function styleObjectToString(style: React.CSSProperties): string {
  return Object.entries(style)
    .filter(([key, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (key === "width" || key === "height") return false;
      return true;
    })
    .map(([key, value]) => {
      const kebab = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${kebab}:${value}`;
    })
    .join("; ");
}

function buildEditorImgStyle(
  values: StyleValues,
  natural: { w: number; h: number } | null
): React.CSSProperties {
  const transforms: string[] = [];
  if (values.rotate) transforms.push(`rotate(${values.rotate}deg)`);
  if (values.flipHorizontal || values.flipVertical) {
    const fx = values.flipHorizontal ? -1 : 1;
    const fy = values.flipVertical ? -1 : 1;
    transforms.push(`scale(${fx}, ${fy})`);
  }

  const top = Math.max(0, values.cropY);
  const left = Math.max(0, values.cropX);
  const right = Math.max(0, 100 - (values.cropX + values.cropWidth));
  const bottom = Math.max(0, 100 - (values.cropY + values.cropHeight));
  const hasCrop = top || left || right || bottom;

  const scaledW = natural ? natural.w * values.scale : null;
  const scaledH = natural ? natural.h * values.scale : null;

  return {
    filter: values.blur > 0 ? `blur(${values.blur}px)` : undefined,
    objectFit: values.objectFit,
    objectPosition: `${values.positionX}% ${values.positionY}%`,
    transform: transforms.length ? transforms.join(" ") : undefined,
    clipPath: hasCrop
      ? `inset(${top}% ${right}% ${bottom}% ${left}%)`
      : undefined,
    width: scaledW !== null ? `${scaledW}px` : undefined,
    height: scaledH !== null ? `${scaledH}px` : undefined,
  };
}

function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}: NodeViewProps) {
  const { open } = useImageStyleModal();
  const stored = parseStyleData(node.attrs.styleData);
  const values: StyleValues = stored ?? DEFAULT_IMAGE_STYLE;

  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [isEditable, setIsEditable] = useState<boolean>(editor.isEditable);

  useEffect(() => {
    const sync = () => setIsEditable(editor.isEditable);
    sync();
    editor.on("update", sync);
    editor.on("transaction", sync);
    return () => {
      editor.off("update", sync);
      editor.off("transaction", sync);
    };
  }, [editor]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const apply = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    if (img.complete) {
      apply();
      return;
    }
    img.addEventListener("load", apply);
    return () => img.removeEventListener("load", apply);
  }, [node.attrs.src]);

  const visualStyle = buildEditorImgStyle(values, naturalSize);

  const overlayStyle: React.CSSProperties | null = values.overlayColor
    ? {
        position: "absolute",
        inset: 0,
        backgroundColor: values.overlayColor,
        opacity: 0.25,
        pointerEvents: "none",
      }
    : null;

  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string | null) ?? "";
  const title = (node.attrs.title as string | null) ?? undefined;
  const align = node.attrs.align as "left" | "center" | "right" | null;

  const showControls = isEditable;

  const wrapperClassName = "relative max-w-full my-2";
  const wrapperStyle: React.CSSProperties =
    align === "left"
      ? { display: "block", float: "left", marginRight: "1rem", clear: "none" }
      : align === "right"
      ? { display: "block", float: "right", marginLeft: "1rem", clear: "none" }
      : align === "center"
      ? {
          display: "block",
          float: "none",
          width: "fit-content",
          maxWidth: "100%",
          marginLeft: "auto",
          marginRight: "auto",
        }
      : { display: "inline-block", verticalAlign: "top" };

  const handleEdit = () => {
    open({
      value: values,
      previewSrc: src,
      title: "Image style",
      onSave: (next) => updateAttributes({ styleData: next }),
    });
  };

  return (
    <NodeViewWrapper className={wrapperClassName} style={wrapperStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        data-drag-handle
        data-style={stored ? JSON.stringify(stored) : undefined}
        data-align={align ?? undefined}
        style={visualStyle}
        className={`max-w-full h-auto ${
          isEditable ? "cursor-move" : ""
        } ${selected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
      />
      {overlayStyle && (
        <span aria-hidden="true" style={overlayStyle as React.CSSProperties} />
      )}
      {showControls && (
        <div
          contentEditable={false}
          className="absolute top-1 right-1 z-10 flex items-center gap-1 bg-white/95 backdrop-blur shadow-md border border-gray-200 rounded-md px-1 py-0.5"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleEdit}
            title="Edit image style"
            aria-label="Edit image style"
            className="w-7 h-7 inline-flex items-center justify-center rounded text-gray-700 hover:bg-gray-100"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => deleteNode()}
            title="Remove image"
            aria-label="Remove image"
            className="w-7 h-7 inline-flex items-center justify-center rounded text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const ImageWithStyle = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      styleData: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-style");
          return parseStyleData(raw);
        },
        renderHTML: (attrs) => {
          const values = parseStyleData(attrs.styleData);
          if (!values) return {};
          const { imgStyle } = applyImageStyle(values);
          const styleString = styleObjectToString(imgStyle);
          return {
            "data-style": JSON.stringify(values),
            ...(styleString ? { style: styleString } : {}),
          };
        },
      },
      align: {
        default: null,
        parseHTML: (element) => {
          const v = element.getAttribute("data-align");
          if (v === "left" || v === "center" || v === "right") return v;
          return null;
        },
        renderHTML: (attrs) => {
          if (!attrs.align) return {};
          return { "data-align": attrs.align };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
