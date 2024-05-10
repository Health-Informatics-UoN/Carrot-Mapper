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
import { Row } from "@tanstack/react-table";
import { toast } from "sonner";

export function ScanReportStatus({ row }: { row: Row<ScanReportList> }) {
  const { id, status } = row.original;
  // Safely extract the color
  const statusInfo = statusOptions.find((option) => option.value === status);
  const textColorClassName = statusInfo?.color ?? "text-black";

  const handleChangeStatus = async (newStatus: string) => {
    try {
      await updateScanReport(id, "status", newStatus);
      const newStatusText =
        statusOptions.find((option) => option.value === newStatus)?.label ?? "";
      toast.success(
        `Scan Report ${row.original.dataset} status has changed to ${newStatusText}.`,
      );
    } catch (error) {
      const errorObj = JSON.parse((error as ApiError).message);
      toast.error(
        `Scan Report ${row.original.dataset} status change has failed: ${errorObj.detail}.`
      );
      console.error(error);
    }
  };

  return (
    <Select value={status} onValueChange={handleChangeStatus}>
      <SelectTrigger className={`${textColorClassName} w-[180px]`}>
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
