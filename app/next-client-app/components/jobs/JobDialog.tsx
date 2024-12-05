"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { GeneralStatus } from "@/constants/job";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "react-tooltip";

interface JobProps {
  jobGroups: Job[][];
  generalStatus: string;
  table_name: string;
}

export default function JobDialog({
  jobGroups,
  table_name,
  generalStatus,
}: JobProps) {
  const generalStatusOption = GeneralStatus.find(
    (option) => option.value == generalStatus
  );
  const Icon = generalStatusOption?.icon || X;

  return (
    <Dialog>
      <DialogTrigger disabled={generalStatus == "NOT_STARTED"}>
        <div role="button">
          <a
            data-tooltip-id="icon-tooltip"
            data-tooltip-content={`${generalStatusOption?.label}`}
            data-tooltip-place="top"
          >
            <Tooltip id="icon-tooltip" />
            <Icon
              className={cn(
                generalStatusOption?.color,
                "size-4",
                Icon === Loader2 && "animate-spin"
              )}
            />
          </a>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-screen-xl overflow-auto h-1/2">
        <DialogHeader>
          <DialogTitle className="flex justify-center text-center">
            Table: {table_name} - Job Progress Details
          </DialogTitle>
        </DialogHeader>
        {jobGroups.length > 0
          ? jobGroups.map((jobs, index) => (
              <DataTable
                key={index}
                columns={columns}
                data={jobs}
                count={jobs.length}
                clickableRow={false}
                normalTable={false}
              />
            ))
          : "Retrieving Jobs"}
      </DialogContent>
    </Dialog>
  );
}
