"use client";

import { useEffect, useState } from "react";
import { useAlert } from "@/framework/ui/useAlert";
import {
  useImageStyleModal,
  saveImageStyle,
  replaceImageFile,
  applyImageStyle,
  DEFAULT_IMAGE_STYLE,
  type StyleValues,
  type ObjectFit,
} from "@/framework/data/image/ImageStyleSettings";

export type ImageMeta = {
  id: number;
  alt: string | null;
  blur: number;
  overlayColor: string | null;
  objectFit: string;
  positionX: number;
  positionY: number;
  rotate: number;
  scale?: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
};

type Props = {
  imageId: number;
  editable?: boolean;
  meta?: ImageMeta;
  onUpdated?: (next: ImageMeta) => void;
};

function toStyleValues(meta: ImageMeta): StyleValues {
  return {
    blur: meta.blur,
    overlayColor: meta.overlayColor,
    objectFit: meta.objectFit as ObjectFit,
    positionX: meta.positionX,
    positionY: meta.positionY,
    rotate: meta.rotate,
    scale: meta.scale ?? DEFAULT_IMAGE_STYLE.scale,
    cropX: meta.cropX ?? DEFAULT_IMAGE_STYLE.cropX,
    cropY: meta.cropY ?? DEFAULT_IMAGE_STYLE.cropY,
    cropWidth: meta.cropWidth ?? DEFAULT_IMAGE_STYLE.cropWidth,
    cropHeight: meta.cropHeight ?? DEFAULT_IMAGE_STYLE.cropHeight,
    flipHorizontal: meta.flipHorizontal ?? DEFAULT_IMAGE_STYLE.flipHorizontal,
    flipVertical: meta.flipVertical ?? DEFAULT_IMAGE_STYLE.flipVertical,
  };
}

export default function Image({ imageId, editable = false, meta, onUpdated }: Props) {
  const [current, setCurrent] = useState<ImageMeta | null>(meta ?? null);
  const [version, setVersion] = useState(0);
  const { showAlert } = useAlert();
  const { open } = useImageStyleModal();

  const src = version > 0
    ? `/api/images/read/${imageId}?v=${version}`
    : `/api/images/read/${imageId}`;

  useEffect(() => {
    if (meta) {
      setCurrent(meta);
      return;
    }
    let cancelled = false;
    fetch(`/api/images/meta/${imageId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.image) setCurrent(data.image as ImageMeta);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [imageId, meta]);

  const { imgStyle, overlayStyle } = current
    ? applyImageStyle(toStyleValues(current))
    : { imgStyle: {} as React.CSSProperties, overlayStyle: null };

  const handleEdit = () => {
    if (!current) return;
    open({
      value: toStyleValues(current),
      previewSrc: src,
      title: `Edit image ${imageId}`,
      allowFileReplace: true,
      onSave: async (values, newFile) => {
        try {
          if (newFile) await replaceImageFile(imageId, newFile);
          await saveImageStyle(imageId, values);
          const next = { ...current, ...values };
          setCurrent(next);
          if (newFile) setVersion((v) => v + 1);
          onUpdated?.(next);
          showAlert("Success", newFile ? "Image replaced" : "Image style updated");
        } catch {
          showAlert("Error", "Failed to update image");
        }
      },
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        src={src}
        alt={current?.alt ?? `Image ${imageId}`}
        className="absolute inset-0 w-full h-full"
        style={imgStyle}
      />
      {overlayStyle && <div style={overlayStyle} />}
      {editable && current && (
        <button
          type="button"
          onClick={handleEdit}
          aria-label="Edit image style"
          className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md border border-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </button>
      )}
    </div>
  );
}
