"use client";

import { UploadStatusOptions } from "@/constants/scanReportStatus";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Tooltip } from "react-tooltip";

interface ScanReportStatusProps {
  upload_status: string;
}

export function UploadStatus({ upload_status }: ScanReportStatusProps) {
  // Safely extract the color
  const statusInfo = UploadStatusOptions.find(
    (option) => option.value === upload_status
  );

  const textColorClassName = statusInfo?.color ?? "text-black";

  const Icon = statusInfo?.icon;

  return (
    <div className={cn(textColorClassName)}>
      <a
        data-tooltip-id="icon-tooltip"
        data-tooltip-content={`${statusInfo?.label}`}
        data-tooltip-place="top"
      >
        <Tooltip id="icon-tooltip" />
        {Icon ? (
          Icon === Loader2 ? (
            <Icon className="ml-2 size-4 animate-spin" />
          ) : (
            <Icon className="ml-2 size-4" />
          )
        ) : null}
      </a>
    </div>
  );
}
