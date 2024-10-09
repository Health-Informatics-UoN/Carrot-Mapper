"use client";

import { UploadStatusOptions } from "@/constants/scanReportStatus";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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
    // <Select
    //   value={upload_status}
    //   onValueChange={handleChangeStatus}
    //   disabled={disabled}
    // >
    //   <SelectTrigger className={cn(textColorClassName, className)}>
    //     <SelectValue />
    //   </SelectTrigger>
    //   <SelectContent>
    //     {UploadStatusOptions.map((option) => (
    //       <SelectItem key={option.value} value={option.value}>
    //         {option.label}
    //       </SelectItem>
    //     ))}
    //   </SelectContent>
    // </Select>
    <div className={cn(textColorClassName)}>
      {Icon ? (
        Icon === Loader2 ? (
          <Icon className="ml-2 size-4 animate-spin" />
        ) : (
          <Icon className="ml-2 size-4" />
        )
      ) : null}
    </div>
  );
}
