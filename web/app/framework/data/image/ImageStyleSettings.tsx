"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RotateCcw, FlipHorizontal2, FlipVertical2 } from "lucide-react";
import { useApp } from "@/framework/ui/context/AppContext";

export type ObjectFit = "cover" | "contain" | "fill" | "none" | "scale-down";

export type StyleValues = {
  blur: number;
  overlayColor: string | null;
  objectFit: ObjectFit;
  positionX: number;
  positionY: number;
  rotate: number;
  scale: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
};

export const DEFAULT_IMAGE_STYLE: StyleValues = {
  blur: 0,
  overlayColor: null,
  objectFit: "cover",
  positionX: 50,
  positionY: 50,
  rotate: 0,
  scale: 1,
  cropX: 0,
  cropY: 0,
  cropWidth: 100,
  cropHeight: 100,
  flipHorizontal: false,
  flipVertical: false,
};

const OBJECT_FIT_OPTIONS: ObjectFit[] = ["cover", "contain", "fill", "none", "scale-down"];

// ---------- Helpers ----------

function clampInt(raw: number, min: number, max: number, fallback: number): number {
  if (Number.isNaN(raw) || !Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}

function clampFloat(raw: number, min: number, max: number, fallback: number): number {
  if (Number.isNaN(raw) || !Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, raw));
}

/**
 * Convert a value the panel handles (which may be a full 8-digit hex like
 * "#rrggbbaa") to the 6-digit hex the native <input type="color"> expects.
 */
function toColorInputValue(color: string | null): string {
  if (!color) return "#000000";
  // Accept "#rgb", "#rrggbb", "#rrggbbaa"
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^#[0-9a-fA-F]{8}$/.test(color)) return color.slice(0, 7);
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const r = color[1], g = color[2], b = color[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
}

/**
 * Compute CSS styles for an `<img>` and an overlay `<div>` from the style
 * values. Consumers can spread these onto their own elements.
 */
export function applyImageStyle(values: StyleValues): {
  imgStyle: React.CSSProperties;
  overlayStyle: React.CSSProperties | null;
} {
  const sx = values.scale * (values.flipHorizontal ? -1 : 1);
  const sy = values.scale * (values.flipVertical ? -1 : 1);
  const transforms: string[] = [];
  if (values.rotate) transforms.push(`rotate(${values.rotate}deg)`);
  if (sx !== 1 || sy !== 1) transforms.push(`scale(${sx}, ${sy})`);

  const top = Math.max(0, values.cropY);
  const left = Math.max(0, values.cropX);
  const right = Math.max(0, 100 - (values.cropX + values.cropWidth));
  const bottom = Math.max(0, 100 - (values.cropY + values.cropHeight));
  const hasCrop = top || left || right || bottom;

  const imgStyle: React.CSSProperties = {
    filter: values.blur > 0 ? `blur(${values.blur}px)` : undefined,
    objectFit: values.objectFit,
    objectPosition: `${values.positionX}% ${values.positionY}%`,
    transform: transforms.length ? transforms.join(" ") : undefined,
    clipPath: hasCrop ? `inset(${top}% ${right}% ${bottom}% ${left}%)` : undefined,
    width: "100%",
    height: "100%",
  };

  const overlayStyle: React.CSSProperties | null = values.overlayColor
    ? {
        position: "absolute",
        inset: 0,
        backgroundColor: values.overlayColor,
        opacity: 0.25,
        pointerEvents: "none",
      }
    : null;

  return { imgStyle, overlayStyle };
}

/**
 * Replace the binary contents of an existing image. Throws on failure.
 */
export async function replaceImageFile(id: number, file: File): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`/api/images/replace/${id}`, { method: "PATCH", body });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to replace image (HTTP ${res.status})`);
  }
}

/**
 * PATCH an existing image's style fields. Throws on failure so the caller can
 * decide how to surface the error (e.g. via useAlert).
 */
export async function saveImageStyle(id: number, values: StyleValues): Promise<void> {
  const res = await fetch("/api/image/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      where: { id },
      data: {
        blur: values.blur,
        overlayColor: values.overlayColor,
        objectFit: values.objectFit,
        positionX: values.positionX,
        positionY: values.positionY,
        rotate: values.rotate,
        scale: values.scale,
        cropX: values.cropX,
        cropY: values.cropY,
        cropWidth: values.cropWidth,
        cropHeight: values.cropHeight,
        flipHorizontal: values.flipHorizontal,
        flipVertical: values.flipVertical,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to update image style (HTTP ${res.status})`);
  }
}

// ---------- Sub-components ----------

const labelClass = "text-sm font-medium text-gray-700";
const rangeClass =
  "w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600";
const sectionClass = "flex flex-col gap-1.5";

function ResetButton({
  onClick,
  disabled,
  title = "Reset to default",
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <RotateCcw size={12} />
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  onReset,
  isDefault,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (v: number) => void;
  onReset?: () => void;
  isDefault?: boolean;
  format?: (v: number) => string;
}) {
  const isFloat = (step ?? 1) < 1;
  return (
    <div className={sectionClass}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className={labelClass}>{label}</label>
          {onReset && <ResetButton onClick={onReset} disabled={isDefault} />}
        </div>
        <span className="text-xs tabular-nums text-gray-500">
          {format ? format(value) : value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => {
          const raw = Number(e.target.value);
          onChange(
            isFloat
              ? clampFloat(raw, min, max, value)
              : clampInt(raw, min, max, value)
          );
        }}
        className={rangeClass}
      />
    </div>
  );
}

// ---------- Panel ----------

type PanelProps = {
  value: StyleValues;
  onChange: (next: StyleValues) => void;
  previewSrc?: string;
};

export function ImageStyleSettingsPanel({ value, onChange, previewSrc }: PanelProps) {
  const set = <K extends keyof StyleValues>(key: K, v: StyleValues[K]) =>
    onChange({ ...value, [key]: v });

  const reset = <K extends keyof StyleValues>(key: K) =>
    set(key, DEFAULT_IMAGE_STYLE[key]);

  const isDefault = <K extends keyof StyleValues>(key: K) =>
    value[key] === DEFAULT_IMAGE_STYLE[key];

  const cropIsDefault =
    value.cropX === DEFAULT_IMAGE_STYLE.cropX &&
    value.cropY === DEFAULT_IMAGE_STYLE.cropY &&
    value.cropWidth === DEFAULT_IMAGE_STYLE.cropWidth &&
    value.cropHeight === DEFAULT_IMAGE_STYLE.cropHeight;

  const resetCrop = () => {
    onChange({
      ...value,
      cropX: DEFAULT_IMAGE_STYLE.cropX,
      cropY: DEFAULT_IMAGE_STYLE.cropY,
      cropWidth: DEFAULT_IMAGE_STYLE.cropWidth,
      cropHeight: DEFAULT_IMAGE_STYLE.cropHeight,
    });
  };

  const flipIsDefault =
    value.flipHorizontal === DEFAULT_IMAGE_STYLE.flipHorizontal &&
    value.flipVertical === DEFAULT_IMAGE_STYLE.flipVertical;

  const resetFlip = () => {
    onChange({
      ...value,
      flipHorizontal: DEFAULT_IMAGE_STYLE.flipHorizontal,
      flipVertical: DEFAULT_IMAGE_STYLE.flipVertical,
    });
  };

  const { imgStyle, overlayStyle } = applyImageStyle(value);

  return (
    <div className="flex flex-col gap-4">
      {previewSrc && (
        <div className="relative w-full h-48 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Style preview"
            style={imgStyle}
            className="block"
          />
          {overlayStyle && <div style={overlayStyle} />}
        </div>
      )}

      <SliderRow
        label="Blur"
        value={value.blur}
        min={0}
        max={20}
        suffix="px"
        onChange={(v) => set("blur", v)}
        onReset={() => reset("blur")}
        isDefault={isDefault("blur")}
      />

      <SliderRow
        label="Scale"
        value={value.scale}
        min={0.1}
        max={4}
        step={0.05}
        suffix="x"
        format={(v) => v.toFixed(2)}
        onChange={(v) => set("scale", v)}
        onReset={() => reset("scale")}
        isDefault={isDefault("scale")}
      />

      <SliderRow
        label="Position X"
        value={value.positionX}
        min={0}
        max={100}
        suffix="%"
        onChange={(v) => set("positionX", v)}
        onReset={() => reset("positionX")}
        isDefault={isDefault("positionX")}
      />

      <SliderRow
        label="Position Y"
        value={value.positionY}
        min={0}
        max={100}
        suffix="%"
        onChange={(v) => set("positionY", v)}
        onReset={() => reset("positionY")}
        isDefault={isDefault("positionY")}
      />

      <SliderRow
        label="Rotate"
        value={value.rotate}
        min={0}
        max={360}
        suffix="°"
        onChange={(v) => set("rotate", v)}
        onReset={() => reset("rotate")}
        isDefault={isDefault("rotate")}
      />

      <div className={sectionClass}>
        <div className="flex items-center gap-1.5">
          <label className={labelClass}>Flip</label>
          <ResetButton onClick={resetFlip} disabled={flipIsDefault} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => set("flipHorizontal", !value.flipHorizontal)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md border ${
              value.flipHorizontal
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FlipHorizontal2 size={14} />
            <span>Horizontal</span>
          </button>
          <button
            type="button"
            onClick={() => set("flipVertical", !value.flipVertical)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md border ${
              value.flipVertical
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FlipVertical2 size={14} />
            <span>Vertical</span>
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="flex items-center gap-1.5">
          <label className={labelClass}>Crop</label>
          <ResetButton onClick={resetCrop} disabled={cropIsDefault} />
        </div>
        <SliderRow
          label="Left"
          value={value.cropX}
          min={0}
          max={Math.max(0, 100 - value.cropWidth)}
          suffix="%"
          onChange={(v) => set("cropX", v)}
          onReset={() => reset("cropX")}
          isDefault={isDefault("cropX")}
        />
        <SliderRow
          label="Top"
          value={value.cropY}
          min={0}
          max={Math.max(0, 100 - value.cropHeight)}
          suffix="%"
          onChange={(v) => set("cropY", v)}
          onReset={() => reset("cropY")}
          isDefault={isDefault("cropY")}
        />
        <SliderRow
          label="Width"
          value={value.cropWidth}
          min={1}
          max={100 - value.cropX}
          suffix="%"
          onChange={(v) => set("cropWidth", v)}
          onReset={() => reset("cropWidth")}
          isDefault={isDefault("cropWidth")}
        />
        <SliderRow
          label="Height"
          value={value.cropHeight}
          min={1}
          max={100 - value.cropY}
          suffix="%"
          onChange={(v) => set("cropHeight", v)}
          onReset={() => reset("cropHeight")}
          isDefault={isDefault("cropHeight")}
        />
      </div>

      <div className={sectionClass}>
        <div className="flex items-center gap-1.5">
          <label className={labelClass}>Object fit</label>
          <ResetButton onClick={() => reset("objectFit")} disabled={isDefault("objectFit")} />
        </div>
        <select
          value={value.objectFit}
          onChange={(e) => set("objectFit", e.target.value as ObjectFit)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
        >
          {OBJECT_FIT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className={sectionClass}>
        <div className="flex items-center gap-1.5">
          <label className={labelClass}>Overlay color</label>
          <ResetButton
            onClick={() => reset("overlayColor")}
            disabled={isDefault("overlayColor")}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={toColorInputValue(value.overlayColor)}
            onChange={(e) => set("overlayColor", e.target.value)}
            className="h-9 w-12 border border-gray-300 rounded cursor-pointer bg-white p-0.5"
          />
          <input
            type="text"
            value={value.overlayColor ?? ""}
            placeholder="#rrggbbaa (or empty)"
            onChange={(e) => {
              const next = e.target.value.trim();
              set("overlayColor", next === "" ? null : next);
            }}
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => set("overlayColor", null)}
            disabled={value.overlayColor === null}
            className="px-2.5 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Leave empty for no overlay. Accepts #rgb, #rrggbb, or #rrggbbaa.
        </p>
      </div>
    </div>
  );
}

// ---------- Modal hook & button ----------

type OpenArgs = {
  value: StyleValues;
  onSave: (values: StyleValues, newFile?: File | null) => void;
  previewSrc?: string;
  title?: string;
  allowFileReplace?: boolean;
};

function ImageStyleModalBody({
  initial,
  previewSrc,
  allowFileReplace,
  onSave,
  onCancel,
}: {
  initial: StyleValues;
  previewSrc?: string;
  allowFileReplace?: boolean;
  onSave: (values: StyleValues, newFile?: File | null) => void;
  onCancel: () => void;
}) {
  const [current, setCurrent] = useState<StyleValues>(initial);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFileUrl, setNewFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!newFile) {
      setNewFileUrl(null);
      return;
    }
    const url = URL.createObjectURL(newFile);
    setNewFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newFile]);

  const effectivePreview = newFileUrl ?? previewSrc;

  return (
    <div className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto md:py-4">
      {allowFileReplace && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Replace image file</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
            />
            {newFile && (
              <button
                type="button"
                onClick={() => setNewFile(null)}
                className="px-2.5 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      <ImageStyleSettingsPanel
        value={current}
        onChange={setCurrent}
        previewSrc={effectivePreview}
      />
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => {
            setCurrent(DEFAULT_IMAGE_STYLE);
            setNewFile(null);
          }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(current, newFile)}
          className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/**
 * Hook that returns an `open` function which mounts the style panel inside the
 * project's fixed modal (via `useApp().openModal`). On Save the modal closes
 * and the provided `onSave` callback receives the final values.
 */
export function useImageStyleModal() {
  const { openModal, closeModal } = useApp();

  const open = ({
    value,
    onSave,
    previewSrc,
    title = "Image style",
    allowFileReplace,
  }: OpenArgs) => {
    const node: ReactNode = (
      <ImageStyleModalBody
        initial={value}
        previewSrc={previewSrc}
        allowFileReplace={allowFileReplace}
        onCancel={closeModal}
        onSave={(values, newFile) => {
          onSave(values, newFile);
          closeModal();
        }}
      />
    );
    openModal(node, title);
  };

  return { open };
}

/**
 * Convenience button that opens the style modal when clicked. Useful when a
 * consumer just wants to render a trigger next to a file input or thumbnail.
 */
export function ImageStyleModalButton({
  value,
  onSave,
  previewSrc,
  label = "Style",
  title,
  className,
  disabled,
}: {
  value: StyleValues;
  onSave: (values: StyleValues) => void;
  previewSrc?: string;
  label?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { open } = useImageStyleModal();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => open({ value, onSave, previewSrc, title })}
      className={
        className ??
        "px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      }
    >
      {label}
    </button>
  );
}
