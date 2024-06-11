"use client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { deleteScanReport } from "@/api/scanreports";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";

interface DeleteDialogProps {
  id: number;
  details?: boolean;
  isOpen?: boolean;
  setOpen?: (isOpen: boolean) => void;
  children?: ReactNode | ReactNode[];
}

const DeleteDialog = ({
  id,
  details = false,
  isOpen,
  setOpen = () => {},
  children,
}: DeleteDialogProps) => {
  const router = useRouter();

  const handleDelete = async () => {
    const response = await deleteScanReport(id);
    if (response) {
      toast.error(`Failed to delete Scan Report! ${response.errorMessage}`);
    } else {
      toast.success("Scan Report successfully deleted");
    }
    setOpen(false);
    if (details) router.push("/scanreports/");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setOpen(false)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-start">
          <DialogTitle>Delete Scan Report</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this Scan Report? This will:
          </DialogDescription>
          <ul className="text-gray-500 list-disc pl-4 pt-2">
            <li>Delete the Scan Report</li>
            <li>Delete the Scan Report file, and data dictionary</li>
            <li>Delete the rules, and will not allow them to be reused</li>
            <li>
              If any rules have been reused in any other Scan Reports, they will
              not be deleted
            </li>
          </ul>
        </DialogHeader>
        <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
          <DialogClose asChild>
            <Button className="bg-black text-white">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
