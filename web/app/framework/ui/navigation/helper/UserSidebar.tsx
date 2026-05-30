"use client";

import type { ReactNode } from "react";
import RightSidebar from "@/framework/ui/navigation/helper/RightSidebar";

type Props = {
  open: boolean;
  onClose: () => void;
  content: ReactNode;
};

export default function UserSidebar({ open, onClose, content }: Props) {
  return (
    <RightSidebar open={open} onClose={onClose} title="Account" side="right">
      {content}
    </RightSidebar>
  );
}
