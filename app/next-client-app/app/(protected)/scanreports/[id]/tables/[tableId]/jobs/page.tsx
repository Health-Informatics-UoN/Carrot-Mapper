import {
  getAllScanReportFields,
  getScanReportField,
  getScanReportPermissions,
  getScanReportTable,
} from "@/api/scanreports";
import { objToQuery } from "@/lib/client-utils";
import { AlertCircleIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ScanReportTableUpdateForm } from "@/components/scanreports/ScanReportTableUpdateForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import StepperComponent from "@/components/stepper";

interface UpdateTableProps {
  params: {
    id: string;
    tableId: string;
  };
}

export default async function UpdateTable({
  params: { id, tableId },
}: UpdateTableProps) {
  const defaultPageSize = 50;
  const defaultParams = {
    fields: "name,id",
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams };
  const query = objToQuery(combinedParams);

  const scanReportsFields = await getAllScanReportFields(id, tableId, query);

  const table = await getScanReportTable(id, tableId);
  const personId = await getScanReportField(id, tableId, table.person_id?.id);
  const dateEvent = await getScanReportField(id, tableId, table.date_event?.id);
  const permissions = await getScanReportPermissions(id);

  return (
    <div>
      <StepperComponent
        ruleActivity={table.current_rules_activity}
        activityStatus={table.activity_status}
      />
    </div>
  );
}
