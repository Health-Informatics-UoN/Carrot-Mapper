"use client";

import { UploadStatusOptions } from "@/constants/scanReportStatus";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Tooltip } from "react-tooltip";

export function UploadStatus({ upload_status }: { upload_status: Status }) {
  const statusInfo = UploadStatusOptions.find(
    (option) => option.value === upload_status.value ?? "IN_PROGRESS"
  );

  const Icon = statusInfo?.icon;

  if (!Icon) {
    return null;
  }

  return (
    <a
      data-tooltip-id="icon-tooltip"
      data-tooltip-content={`${statusInfo?.label}`}
      data-tooltip-place="top"
      className="flex justify-center"
    >
      <Tooltip id="icon-tooltip" />
      <Icon
        className={cn(
          statusInfo.color,
          "size-4",
          Icon === Loader2 && "animate-spin"
        )}
      />
    </a>
  );
}
