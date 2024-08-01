import {
  getScanReport,
  getScanReportField,
  getScanReportPermissions,
  getScanReportTable,
} from "@/api/scanreports";
import { ScanReportFieldEditForm } from "@/components/scanreports/ScanReportFieldEditForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ScanReportsEditFieldProps {
  params: {
    id: string;
    tableId: string;
    fieldId: string;
  };
}

export default async function ScanReportsEditField({
  params: { id, tableId, fieldId },
}: ScanReportsEditFieldProps) {
  const scanReportsName = await getScanReport(id);
  const tableName = await getScanReportTable(tableId);
  const field = await getScanReportField(fieldId);
  const permissions = await getScanReportPermissions(id);

  return (
    <div>
      <div className="gap-2 flex">
        {" "}
        <Link href={`/scanreports/${id}/tables/${tableId}`}>
          <Button variant={"secondary"} className="mb-3">
            Table: {tableName.name}
          </Button>
        </Link>
        <Button variant={"secondary"} className="mb-3">
          Update Field: {field.name}
        </Button>
      </div>
      <div className="mt-2">
        <ScanReportFieldEditForm
          scanreportId={scanReportsName.id}
          scanReportField={field}
          permissions={permissions.permissions}
        />
      </div>
    </div>
  );
}
