import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function Modal({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: string;
}) {
  const handleOpenChange = () => {
    // Make sure that the dialog will be closed and not coming back the last URL with pagination
    // Navigate to the new URL
    if (["summary", "analyse"].includes(modal)) {
      window.location.href = `${window.location.pathname.replace(
        `/${modal}`,
        ""
      )}`;
    }
  };

  return (
    <Dialog
      defaultOpen={true}
      open={true}
      onOpenChange={handleOpenChange}
      modal={true}
    >
      <DialogContent className="w-11/12 max-w-screen-2xl overflow-auto h-4/5">
        {modal === "summary" ? (
          <DialogHeader>
            <DialogTitle>Summary of Mapping Rules list</DialogTitle>
            <DialogDescription className="justify-center items-center text-center">
              {" "}
              The table below shows the list of mapping rules which have the
              Term Map and have the Desination Field name without
              "_source_concept_id"
            </DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader>
            <DialogTitle>Analyse Rules</DialogTitle>
            <DialogDescription className="justify-center items-center text-center">
              {" "}
              This analysis compares this Scanreport to all other ScanReports,
              finding ancestors and descendants of each, and reporting the
              results including any mismatched Concepts found.
            </DialogDescription>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
