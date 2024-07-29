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
import { cn } from "@/lib/utils"; // Import the cn function

export function ScanReportStatus({
  id,
  status,
  dataset,
  customClassName, // Add a className prop for additional customization
}: {
  id: number;
  status: string;
  dataset: string;
  customClassName?: string;
}) {
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
      <SelectTrigger
        className={cn("w-[180px]", textColorClassName, customClassName)}
      >
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
