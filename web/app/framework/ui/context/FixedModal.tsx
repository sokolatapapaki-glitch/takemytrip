"use client";

import { useState, type ReactNode } from "react";

export function useFixedModalState() {
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);

  const openModal = (content: ReactNode, title?: string) => {
    setModalContent(content);
    setModalTitle(title);
  };

  const closeModal = () => {
    setModalContent(null);
    setModalTitle(undefined);
  };

  const modalNode = modalContent ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">{modalTitle ?? ""}</h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{modalContent}</div>
      </div>
    </div>
  ) : null;

  return { openModal, closeModal, modalNode };
}
