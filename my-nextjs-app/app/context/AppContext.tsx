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

type Theme = "light" | "dark";

type AppContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
  isModalOpen: boolean;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  // True only when a pointer press actually started on the backdrop, so the
  // synthetic "ghost click" from the opening tap can't immediately dismiss it.
  const backdropPressed = useRef(false);

  const isModalOpen = modalContent !== null;

  // Keep the <html> class in sync so Tailwind's dark: variants apply.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!isModalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isModalOpen]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const openModal = useCallback((content: ReactNode) => {
    setModalContent(content);
  }, []);

  const closeModal = useCallback(() => {
    setModalContent(null);
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
      value={{ theme, toggleTheme, openModal, closeModal, isModalOpen }}
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
            className="relative flex h-full w-full flex-col overflow-y-auto bg-white text-black shadow-xl dark:bg-zinc-900 dark:text-zinc-50 sm:h-auto sm:max-h-full sm:w-full sm:max-w-lg sm:rounded-2xl"
          >
            <button
              onClick={closeModal}
              aria-label="Close modal"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-zinc-500 transition-colors hover:bg-black/[.06] dark:hover:bg-white/[.08]"
            >
              ×
            </button>

            <div className="p-6">{modalContent}</div>
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
