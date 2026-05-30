"use client";

import { useApp } from "@/framework/ui/context/AppContext";
import { type AlertType } from "@/framework/ui/Alert";

type AlertOptions = {
  durationMs?: number;
};

export function useAlert() {
  const { addAlert } = useApp();

  const showAlert = (
    type: AlertType,
    message: string,
    { durationMs = 3000 }: AlertOptions = {}
  ) => {
    return addAlert({ type, message, durationMs });
  };

  return { showAlert };
}
