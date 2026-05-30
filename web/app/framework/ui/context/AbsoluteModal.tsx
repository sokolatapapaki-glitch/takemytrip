"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

export type AbsoluteModalSide = "top" | "bottom" | "left" | "right";
export type AbsoluteModalAlign = "start" | "center" | "end";

export type AbsoluteModalPosition = {
  relativeToButton?: boolean;
  anchor?: HTMLElement | null;
  side?: AbsoluteModalSide;
  align?: AbsoluteModalAlign;
  offset?: number;
  matchAnchorWidth?: boolean;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
};

export type OpenAbsoluteModalArgs = {
  component: React.ReactNode;
  position: AbsoluteModalPosition;
  id?: string;
  closeOnLeave?: boolean;
  closeOnOutsideClick?: boolean;
};

export type UseAbsoluteModalArgs = {
  component: React.ReactNode;
  side?: AbsoluteModalSide;
  align?: AbsoluteModalAlign;
  offset?: number;
  matchAnchorWidth?: boolean;
  closeOnLeave?: boolean;
  closeOnOutsideClick?: boolean;
  relativeToButton?: boolean;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
};

type AbsoluteModalEntry = {
  id: string;
  component: React.ReactNode;
  position: AbsoluteModalPosition;
  closeOnLeave: boolean;
  closeOnOutsideClick: boolean;
};

function computeAbsoluteModalStyle(p: AbsoluteModalPosition): React.CSSProperties {
  const relative = p.relativeToButton ?? true;
  if (!relative || !p.anchor) {
    return { top: p.top, left: p.left, right: p.right, bottom: p.bottom };
  }
  const rect = p.anchor.getBoundingClientRect();
  const side = p.side ?? "bottom";
  const align = p.align ?? "start";
  const offset = p.offset ?? 4;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const style: React.CSSProperties = {};
  const transforms: string[] = [];

  if (side === "bottom" || side === "top") {
    if (side === "bottom") {
      style.top = rect.bottom + sy + offset;
    } else {
      style.top = rect.top + sy - offset;
      transforms.push("translateY(-100%)");
    }
    if (align === "start") style.left = rect.left + sx;
    else if (align === "center") {
      style.left = rect.left + sx + rect.width / 2;
      transforms.push("translateX(-50%)");
    } else {
      style.left = rect.right + sx;
      transforms.push("translateX(-100%)");
    }
  } else {
    if (side === "right") {
      style.left = rect.right + sx + offset;
    } else {
      style.left = rect.left + sx - offset;
      transforms.push("translateX(-100%)");
    }
    if (align === "start") style.top = rect.top + sy;
    else if (align === "center") {
      style.top = rect.top + sy + rect.height / 2;
      transforms.push("translateY(-50%)");
    } else {
      style.top = rect.bottom + sy;
      transforms.push("translateY(-100%)");
    }
  }

  if (transforms.length) style.transform = transforms.join(" ");
  if (p.matchAnchorWidth) style.width = rect.width;
  return style;
}

function AbsoluteModalSlot({
  modal,
  cancelClose,
  closeSoon,
}: {
  modal: AbsoluteModalEntry;
  cancelClose: (id: string) => void;
  closeSoon: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [effectiveSide, setEffectiveSide] = useState<AbsoluteModalSide | undefined>(modal.position.side);
  const [shift, setShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const adjustedRef = useRef(false);
  const lastPositionRef = useRef(modal.position);

  if (lastPositionRef.current !== modal.position) {
    lastPositionRef.current = modal.position;
    adjustedRef.current = false;
    setEffectiveSide(modal.position.side);
    setShift({ x: 0, y: 0 });
  }

  const baseStyle = computeAbsoluteModalStyle({
    ...modal.position,
    side: effectiveSide,
  });

  const style: React.CSSProperties = { ...baseStyle };
  if (shift.x !== 0 || shift.y !== 0) {
    const base = typeof baseStyle.transform === "string" ? baseStyle.transform : "";
    style.transform = `${base} translate(${shift.x}px, ${shift.y}px)`.trim();
  }

  useLayoutEffect(() => {
    if (adjustedRef.current) return;
    const isAnchored = (modal.position.relativeToButton ?? true) && !!modal.position.anchor;
    if (!isAnchored) {
      adjustedRef.current = true;
      return;
    }
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const anchorRect = modal.position.anchor!.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const offset = modal.position.offset ?? 4;
    const currentSide = effectiveSide ?? "bottom";

    const sideOverflows = (s: AbsoluteModalSide) => {
      if (s === "right") return anchorRect.right + offset + w > vw - pad;
      if (s === "left") return anchorRect.left - offset - w < pad;
      if (s === "bottom") return anchorRect.bottom + offset + h > vh - pad;
      return anchorRect.top - offset - h < pad;
    };

    let side = currentSide;
    if (sideOverflows(currentSide)) {
      if (currentSide === "right" || currentSide === "left") {
        side = !sideOverflows("bottom") ? "bottom" : !sideOverflows("top") ? "top" : currentSide;
      } else if (currentSide === "bottom") {
        side = !sideOverflows("top") ? "top" : currentSide;
      } else {
        side = !sideOverflows("bottom") ? "bottom" : currentSide;
      }
    }

    if (side !== currentSide) {
      setEffectiveSide(side);
      setShift({ x: 0, y: 0 });
      return;
    }

    let shiftX = shift.x;
    let shiftY = shift.y;
    if (rect.left < pad) shiftX += pad - rect.left;
    else if (rect.right > vw - pad) shiftX += vw - pad - rect.right;
    if (rect.top < pad) shiftY += pad - rect.top;
    else if (rect.bottom > vh - pad) shiftY += vh - pad - rect.bottom;

    if (shiftX !== shift.x || shiftY !== shift.y) {
      setShift({ x: shiftX, y: shiftY });
    }
    adjustedRef.current = true;
  });

  useEffect(() => {
    const handler = () => {
      adjustedRef.current = false;
      setEffectiveSide(modal.position.side);
      setShift({ x: 0, y: 0 });
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [modal.position]);

  const isAnchored = (modal.position.relativeToButton ?? true) && !!modal.position.anchor;
  const positionClass = isAnchored ? "absolute" : "fixed";

  return (
    <div
      ref={ref}
      data-absolute-modal
      className={`${positionClass} z-[70]`}
      style={style}
      onMouseEnter={modal.closeOnLeave ? () => cancelClose(modal.id) : undefined}
      onMouseLeave={modal.closeOnLeave ? () => closeSoon(modal.id) : undefined}
    >
      {modal.component}
    </div>
  );
}

export function useAbsoluteModalState() {
  const [absoluteModals, setAbsoluteModals] = useState<AbsoluteModalEntry[]>([]);
  const absoluteCloseTimers = useRef<Map<string, number>>(new Map());
  const absoluteIdCounter = useRef(0);

  const cancelCloseAbsoluteModal = (id: string) => {
    const t = absoluteCloseTimers.current.get(id);
    if (t !== undefined) {
      window.clearTimeout(t);
      absoluteCloseTimers.current.delete(id);
    }
  };

  const openAbsoluteModal = ({
    component,
    position,
    id,
    closeOnLeave,
    closeOnOutsideClick,
  }: OpenAbsoluteModalArgs): string => {
    const modalId = id ?? `abs-modal-${++absoluteIdCounter.current}`;
    cancelCloseAbsoluteModal(modalId);
    setAbsoluteModals((prev) => {
      const without = prev.filter((m) => m.id !== modalId);
      return [
        ...without,
        {
          id: modalId,
          component,
          position,
          closeOnLeave: closeOnLeave ?? false,
          closeOnOutsideClick: closeOnOutsideClick ?? true,
        },
      ];
    });
    return modalId;
  };

  const closeAbsoluteModal = (id?: string) => {
    if (id === undefined) {
      absoluteCloseTimers.current.forEach((t) => window.clearTimeout(t));
      absoluteCloseTimers.current.clear();
      setAbsoluteModals([]);
      return;
    }
    cancelCloseAbsoluteModal(id);
    setAbsoluteModals((prev) => prev.filter((m) => m.id !== id));
  };

  const closeAbsoluteModalSoon = (id: string, delay = 200) => {
    cancelCloseAbsoluteModal(id);
    const t = window.setTimeout(() => {
      setAbsoluteModals((prev) => prev.filter((m) => m.id !== id));
      absoluteCloseTimers.current.delete(id);
    }, delay);
    absoluteCloseTimers.current.set(id, t);
  };

  const isAbsoluteModalOpen = (id: string) => absoluteModals.some((m) => m.id === id);

  const hasAbsoluteModal = absoluteModals.length > 0;
  useEffect(() => {
    if (!hasAbsoluteModal) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-absolute-modal]")) return;
      if (target.closest("[data-absolute-modal-trigger]")) return;
      setAbsoluteModals((prev) => {
        prev
          .filter((m) => m.closeOnOutsideClick)
          .forEach((m) => cancelCloseAbsoluteModal(m.id));
        return prev.filter((m) => !m.closeOnOutsideClick);
      });
    };
    const attachId = window.setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      window.clearTimeout(attachId);
      document.removeEventListener("mousedown", handler);
    };
  }, [hasAbsoluteModal]);

  const modalsNode = (
    <>
      {absoluteModals.map((m) => (
        <AbsoluteModalSlot
          key={m.id}
          modal={m}
          cancelClose={cancelCloseAbsoluteModal}
          closeSoon={closeAbsoluteModalSoon}
        />
      ))}
    </>
  );

  return {
    openAbsoluteModal,
    closeAbsoluteModal,
    closeAbsoluteModalSoon,
    cancelCloseAbsoluteModal,
    isAbsoluteModalOpen,
    modalsNode,
  };
}
