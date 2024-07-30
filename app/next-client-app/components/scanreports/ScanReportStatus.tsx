"use client";
import { updateScanReport } from "@/api/scanreports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusOptions } from "@/constants/scanReportStatus";
import { ApiError } from "@/lib/api/error";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SelectTriggerProps } from "@radix-ui/react-select";

interface ScanReportStatusProps extends SelectTriggerProps {
  id: string;
  status: string;
  dataset: string;
  className?: string;
}

export function ScanReportStatus({
  id,
  status,
  dataset,
  className,
}: ScanReportStatusProps) {
  // Safely extract the color
  const statusInfo = statusOptions.find((option) => option.value === status);
  const textColorClassName = statusInfo?.color ?? "text-black";

  const handleChangeStatus = async (newStatus: string) => {
    try {
      await updateScanReport(id, { status: newStatus });
      const newStatusText =
        statusOptions.find((option) => option.value === newStatus)?.label ?? "";
      toast.success(
        `Scan Report ${dataset} status has changed to ${newStatusText}.`
      );
    } catch (error) {
      const errorObj = JSON.parse((error as ApiError).message);
      toast.error(
        `Scan Report ${dataset} status change has failed: ${errorObj.detail}.`
      );
      console.error(error);
    }
  };

  return (
    <Select value={status} onValueChange={handleChangeStatus}>
      <SelectTrigger className={cn(textColorClassName, className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
