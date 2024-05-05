import { updateScanReport } from "@/api/scanreports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Row } from "@tanstack/react-table";

export function ScanReportStatus({ row }: { row: Row<ScanReportResult> }) {
  const statusMapping = {
    BLOCKED: { text: "Blocked", color: "text-red-900" },
    COMPLET: { text: "Mapping Complete", color: "text-green-600" },
    INPRO25: { text: "Mapping 25%", color: "text-orange-300" },
    INPRO50: { text: "Mapping 50%", color: "text-orange-400" },
    INPRO75: { text: "Mapping 75%", color: "text-orange-500" },
    UPCOMPL: { text: "Upload Complete", color: "text-blue-800" },
    UPFAILE: { text: "Upload Failed", color: "text-red-500" },
    UPINPRO: { text: "Upload in Progress", color: "text-orange-600" },
  };

  const { id, status } = row.original;
  const statusInfo = statusMapping[status as keyof typeof statusMapping];
  const textColorClassName = statusInfo?.color ?? "text-black";

  const handleChangeStatus = async (value: string) => {
    try {
      await updateScanReport(id, "status", value);
    } catch (error) {
      // do toast
      console.error(error);
    }
  };

  return (
    <Select value={status} onValueChange={handleChangeStatus}>
      <SelectTrigger className={`${textColorClassName} w-[180px]`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusMapping).map(([value, { text, color }]) => (
          <SelectItem key={value} value={value}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
