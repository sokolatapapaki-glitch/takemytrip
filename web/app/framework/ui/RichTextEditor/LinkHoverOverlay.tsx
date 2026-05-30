"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { type Editor } from "@tiptap/react";
import { X } from "lucide-react";

type Props = {
  editor: Editor;
  wrapperRef: RefObject<HTMLDivElement | null>;
};

export default function LinkHoverOverlay({ editor, wrapperRef }: Props) {
  const closeTimerRef = useRef<number | null>(null);
  const [hoveredLink, setHoveredLink] = useState<{
    el: HTMLAnchorElement;
    rect: DOMRect;
  } | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setHoveredLink(null), 150);
  }, [cancelClose]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;
      if (link && wrapper.contains(link)) {
        cancelClose();
        setHoveredLink({ el: link, rect: link.getBoundingClientRect() });
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || (!link.contains(related) && !related.closest?.("[data-link-remove]"))) {
        scheduleClose();
      }
    };

    const clear = () => setHoveredLink(null);

    wrapper.addEventListener("mouseover", onMouseOver);
    wrapper.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    return () => {
      wrapper.removeEventListener("mouseover", onMouseOver);
      wrapper.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
    };
  }, [wrapperRef, cancelClose, scheduleClose]);

  const removeLink = () => {
    if (!hoveredLink) return;
    const pos = editor.view.posAtDOM(hoveredLink.el, 0);
    if (pos == null || pos < 0) return;
    editor
      .chain()
      .focus()
      .setTextSelection(pos)
      .extendMarkRange("link")
      .unsetLink()
      .run();
    setHoveredLink(null);
  };

  if (!hoveredLink) return null;

  return (
    <button
      type="button"
      data-link-remove="true"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      onClick={removeLink}
      aria-label="Remove link"
      title="Remove link"
      className="fixed z-50 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
      style={{
        top: hoveredLink.rect.top - 8,
        left: hoveredLink.rect.right - 6,
      }}
    >
      <X size={12} />
    </button>
  );
}
