"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FaXmark } from "react-icons/fa6";
import type { Activity } from "../components/ActivityCombinations/core/activities.functions";
import { ActivityDetail } from "../components/ActivityDetail";
import { hoverScrollbar } from "../components/ui/scrollbar";
import { useScrollLock } from "../components/ui/useScrollLock";

type Theme = "light" | "dark";

// "wide" is for content with a two-column layout (e.g. the activity detail
// modal); the default stays the original max-w-lg sheet.
type ModalSize = "default" | "wide";

type AppContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  openModal: (
    content: ReactNode,
    options?: { size?: ModalSize; hideClose?: boolean }
  ) => void;
  // Opens the activity detail modal (wide) for the given activity — usable from
  // any "See more" trigger anywhere in the app.
  openActivity: (activity: Activity) => void;
  closeModal: () => void;
  isModalOpen: boolean;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [modal, setModal] = useState<{
    content: ReactNode;
    size: ModalSize;
    // When true the modal's own × is hidden (the content renders its own close
    // control — e.g. the activity detail's header X next to "Previous Activity").
    hideClose?: boolean;
  } | null>(null);
  // True only when a pointer press actually started on the backdrop, so the
  // synthetic "ghost click" from the opening tap can't immediately dismiss it.
  const backdropPressed = useRef(false);
  // The scrollable modal panel — reset to the top whenever its content changes.
  const panelRef = useRef<HTMLDivElement>(null);

  const isModalOpen = modal !== null;

  // Always show a freshly opened (or swapped) modal scrolled to the top.
  useEffect(() => {
    if (modal) panelRef.current?.scrollTo({ top: 0 });
  }, [modal]);

  // Keep the <html> class in sync so Tailwind's dark: variants apply.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Lock the page scroll while the modal is open.
  useScrollLock(isModalOpen);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const openModal = useCallback(
    (content: ReactNode, options?: { size?: ModalSize; hideClose?: boolean }) => {
      setModal({
        content,
        size: options?.size ?? "default",
        hideClose: options?.hideClose,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const openActivity = useCallback((activity: Activity) => {
    setModal({
      // key remounts the detail (resetting its history) when opening a
      // different activity while the modal is already up.
      content: (
        <ActivityDetail
          key={activity.name}
          activity={activity}
          onClose={() => setModal(null)}
        />
      ),
      size: "wide",
      // The detail renders its own header X (aligned with "Previous Activity").
      hideClose: true,
    });
  }, []);

  // Close on Escape key.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, closeModal]);

  return (
    <AppContext.Provider
      value={{ theme, toggleTheme, openModal, openActivity, closeModal, isModalOpen }}
    >
      {children}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex h-screen w-screen items-stretch justify-center bg-black/50 sm:h-full sm:items-center sm:py-8"
          onPointerDown={(e) => {
            backdropPressed.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            // Only dismiss if the press both started and ended on the backdrop.
            if (e.target === e.currentTarget && backdropPressed.current) {
              closeModal();
            }
            backdropPressed.current = false;
          }}
        >
          <div
            ref={panelRef}
            data-modal-scroll
            className={`relative flex h-full w-full flex-col overflow-y-auto bg-white text-black shadow-xl dark:bg-zinc-900 dark:text-zinc-50 sm:h-auto sm:max-h-full sm:w-full sm:rounded-2xl ${hoverScrollbar} ${
              modal.size === "wide" ? "sm:max-w-4xl" : "sm:max-w-lg"
            }`}
          >
            {!modal.hideClose && (
              <button
                onClick={closeModal}
                aria-label="Close modal"
                className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.06] hover:text-zinc-800 dark:hover:bg-white/[.08] dark:hover:text-zinc-100"
              >
                <FaXmark className="h-6 w-6" />
              </button>
            )}

            <div className="p-6">{modal.content}</div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
