"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { CreateDatasetForm } from "./CreateDatasetForm";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useState } from "react";

export function CreateDatasetDialog({
  dataPartnerID,
  projects,
  dataPartnerList,
  description,
  setReloadDataset,
}: {
  dataPartnerID?: number;
  projects: Project[];
  dataPartnerList?: DataPartner[];
  description?: boolean;
  setReloadDataset?: (reloadDataset: boolean) => void;
}) {
  const [dialogOpened, setDialogOpened] = useState(false);

  return (
    <Dialog open={dialogOpened} onOpenChange={setDialogOpened}>
      <DialogTrigger asChild>
        <Button variant={"outline"} className="ml-4 flex">
          New Dataset <Plus className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Create a New Dataset</DialogTitle>
        </DialogHeader>
        {description && (
          <DialogDescription className="justify-center items-center text-center">
            {" "}
            Notice: Data Partner is set as the choosen Data Partner in the
            previous form.
          </DialogDescription>
        )}
        <CreateDatasetForm
          projectList={projects}
          dataPartnerID={dataPartnerID}
          dataPartnerList={dataPartnerList}
          setDialogOpened={setDialogOpened}
          setReloadDataset={setReloadDataset}
        />
      </DialogContent>
    </Dialog>
  );
}
