import {
  getScanReport,
  getScanReportField,
  getScanReportPermissions,
} from "@/api/scanreports";
import { ScanReportFieldEditForm } from "@/components/scanreports/ScanReportFieldEditForm";
import { notFound } from "next/navigation";

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
  const scanReport = await getScanReport(id);

  const field = await getScanReportField(fieldId);
  const permissions = await getScanReportPermissions(id);

  if (!scanReport) {
    return notFound();
  }

  return (
    <div className="pt-10 px-16">
      <div className="flex justify-between mt-3">
        <h1 className="text-4xl font-semibold">Update Field - {field?.name}</h1>
      </div>
      <div className="mt-4">
        <ScanReportFieldEditForm
          scanreportId={scanReport.id}
          scanReportField={field}
          permissions={permissions.permissions}
        />
      </div>
    </div>
  );
}
