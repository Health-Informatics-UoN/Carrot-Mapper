import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getAllScanReportFields,
  getScanReport,
  getScanReportField,
  getScanReportPermissions,
  getScanReportTable,
} from "@/api/scanreports";
import { objToQuery } from "@/lib/client-utils";
import { AlertCircleIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ScanReportTableUpdateForm } from "@/components/scanreports/ScanReportTableUpdateForm";

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
    scan_report_table: tableId,
    fields: "name,id",
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams };
  const query = objToQuery(combinedParams);

  const scanReportsFields = await getAllScanReportFields(query);

  const scanReportsName = await getScanReport(id);
  const table = await getScanReportTable(tableId);
  const personId = await getScanReportField(table.person_id as string);
  const dateEvent = await getScanReportField(table.date_event as string);
  const permissions = await getScanReportPermissions(id);

  return (
    <div>
      {(table.date_event === null || table.person_id === null) && (
        <Alert className="flex items-center gap-3 bg-carrot text-white mt-4 w-1/2">
          <div>
            <AlertCircleIcon />
          </div>
          <div>
            {" "}
            Mapping Rules cannot be generated without the Person ID and Date
            Event being set.
            <br />
            Once you set these, Mapping Rules will be generated for all Concepts
            currently associated to the table.
            <br />
          </div>
        </Alert>
      )}
      <div className="mt-4">
        <ScanReportTableUpdateForm
          scanreportFields={scanReportsFields}
          scanreportTable={table}
          permissions={permissions.permissions}
          personId={personId}
          dateEvent={dateEvent}
        />
      </div>
    </div>
  );
}
