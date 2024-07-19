import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

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
      <DialogContent className="w-full max-w-screen-2xl overflow-auto h-4/5">
        <DialogHeader>
          <DialogTitle>Summary of Mapping Rules list</DialogTitle>
          <DialogDescription className="justify-center items-center text-center">
            {" "}
            The table below shows the list of mapping rules which have the Term
            Map and have the Desination Field name without "_source_concept_id"
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
