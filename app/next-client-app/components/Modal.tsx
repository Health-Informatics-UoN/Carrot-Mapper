"use client";

import { Dialog, DialogOverlay, DialogContent } from "./ui/dialog";
import { useRouter } from "next/navigation";

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleOpenChange = () => {
    router.back();
  };

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogOverlay>
        <DialogContent className="w-full max-w-screen-2xl overflow-auto max-h-screen-2xl">
          {children}
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
