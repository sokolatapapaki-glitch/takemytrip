"use client";

import { useEffect, useRef, useState } from "react";

export type AlertType = "Success" | "Error" | "Warning";

type Props = {
  type: AlertType;
  message: string;
  durationMs?: number;
  onClose?: () => void;
};

const styles: Record<AlertType, { container: string; bar: string; icon: string }> = {
  Success: {
    container: "bg-green-50 border-green-300 text-green-800",
    bar: "bg-green-500",
    icon: "✓",
  },
  Error: {
    container: "bg-red-50 border-red-300 text-red-800",
    bar: "bg-red-500",
    icon: "✕",
  },
  Warning: {
    container: "bg-yellow-50 border-yellow-300 text-yellow-800",
    bar: "bg-yellow-500",
    icon: "⚠",
  },
};

const SLIDE_MS = 300;

export default function Alert({ type, message, durationMs = 3000, onClose }: Props) {
  const s = styles[type];
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 10);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!entered || durationMs <= 0) return;
    const t = window.setTimeout(() => setLeaving(true), durationMs);
    return () => window.clearTimeout(t);
  }, [entered, durationMs]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => onCloseRef.current?.(), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);

  const offscreen = !entered || leaving;
  const draining = entered && !leaving;

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 pl-8 pr-3 py-4 sm:pl-7 sm:pr-3 sm:py-3 rounded-lg border shadow-md w-full sm:w-auto sm:min-w-[280px] sm:max-w-md transition-transform duration-300 ease-out ${s.container} ${offscreen ? "translate-x-[120%]" : "translate-x-0"}`}
    >
      <span className="font-bold text-lg sm:text-base leading-5">{s.icon}</span>
      <p className="flex-1 text-base sm:text-sm leading-6 sm:leading-5">{message}</p>
      <button
        type="button"
        onClick={() => setLeaving(true)}
        className="text-current opacity-50 hover:opacity-100 text-3xl sm:text-2xl leading-none flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 -mt-1 shrink-0"
        aria-label="Close"
      >
        ×
      </button>

      <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-1 bg-black/10">
        <div
          className={`absolute top-0 left-0 right-0 ${s.bar}`}
          style={{
            height: draining ? "0%" : "100%",
            transition: draining ? `height ${durationMs}ms linear` : "none",
          }}
        />
      </div>
    </div>
  );
}
