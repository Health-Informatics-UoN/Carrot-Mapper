"use client";
import { updateScanReport } from "@/api/scanreports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MappingStatusOptions } from "@/constants/scanReportStatus";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SelectTriggerProps } from "@radix-ui/react-select";

interface ScanReportStatusProps extends SelectTriggerProps {
  id: string;
  mapping_status: string;
  dataset: string;
  disabled: boolean;
}

export function MappingStatus({
  id,
  mapping_status,
  dataset,
  className,
  disabled,
}: ScanReportStatusProps) {
  // Safely extract the color
  const statusInfo = MappingStatusOptions.find(
    (option) => option.value === mapping_status
  );
  const textColorClassName = statusInfo?.color ?? "text-black";

  const handleChangeStatus = async (newStatus: string) => {
    const response = await updateScanReport(parseInt(id), {
      mapping_status: newStatus,
    });
    const newStatusText =
      MappingStatusOptions.find((option) => option.value === newStatus)
        ?.label ?? "";
    if (response) {
      toast.error(
        `Scan Report ${dataset} status change has failed: ${response.errorMessage}.`
      );
    } else {
      toast.success(
        `Scan Report ${dataset} status has changed to ${newStatusText}.`
      );
    }
  };

  return (
    <Select
      value={mapping_status}
      onValueChange={handleChangeStatus}
      disabled={disabled}
    >
      <SelectTrigger className={cn(textColorClassName, className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MappingStatusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
