"use client";

import { Dialog, DialogContent } from "./ui/dialog";

export function Modal({ children }: { children: React.ReactNode }) {
  const handleOpenChange = () => {
    // Make sure that the dialog will be closed and not coming back the last URL with pagination
    // Navigate to the new URL
    window.location.href = `${window.location.pathname.replace(
      "/summary",
      ""
    )}`;
  };

  return (
    <Dialog
      defaultOpen={true}
      open={true}
      onOpenChange={handleOpenChange}
      modal={true}
    >
      {/* TODO: Add tille and description */}
      <DialogContent className="w-full max-w-screen-xl overflow-auto max-h-screen-xl">
        {children}
      </DialogContent>
    </Dialog>
  );
}
