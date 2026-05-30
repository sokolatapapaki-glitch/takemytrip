"use client";

import { useRef, useState } from "react";
import { useAlert } from "@/framework/ui/useAlert";
import {
  ImageStyleModalButton,
  DEFAULT_IMAGE_STYLE,
  applyImageStyle,
  saveImageStyle,
  type StyleValues,
} from "@/framework/data/image/ImageStyleSettings";

type Props = {
  onUploaded?: (id: number) => void;
};

export default function ImageUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [style, setStyle] = useState<StyleValues>(DEFAULT_IMAGE_STYLE);
  const { showAlert } = useAlert();

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/images/create", { method: "POST", body });
      if (!res.ok) throw new Error("Upload failed");
      const { id } = await res.json();

      if (style !== DEFAULT_IMAGE_STYLE) {
        try {
          await saveImageStyle(id, style);
        } catch {
          showAlert("Warning", "Image uploaded, but style failed to save");
        }
      }

      showAlert("Success", "Image uploaded");
      onUploaded?.(id);
      reset();
    } catch {
      showAlert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setStyle(DEFAULT_IMAGE_STYLE);
    if (inputRef.current) inputRef.current.value = "";
  };

  const { imgStyle, overlayStyle } = applyImageStyle(style);

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
      />

      {preview && (
        <div className="relative w-full max-h-64 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img src={preview} alt="Preview" style={{ ...imgStyle, maxHeight: 256 }} />
          {overlayStyle && <div style={overlayStyle} />}
        </div>
      )}

      {file && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <ImageStyleModalButton
            value={style}
            onSave={setStyle}
            previewSrc={preview ?? undefined}
            label="Style"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={reset}
            disabled={uploading}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
