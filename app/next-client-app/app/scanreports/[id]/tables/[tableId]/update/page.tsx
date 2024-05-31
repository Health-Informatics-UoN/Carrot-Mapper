import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getScanReport,
  getScanReportFields,
  getScanReportTable,
} from "@/api/scanreports";
import { objToQuery } from "@/lib/client-utils";
import { AlertCircleIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { UpdateForm } from "@/components/update-SR-table/UpdateForm";

interface UpdateTableProps {
  params: {
    id: string;
    tableId: string;
  };
}

export default async function UpdateTable({
  params: { id, tableId },
}: UpdateTableProps) {
  const defaultParams = {
    scan_report_table: tableId,
    fields: "name,id",
  };
  const combinedParams = { ...defaultParams };

  const query = objToQuery(combinedParams);

  const scanReportsFields = await getScanReportFields(query);
  const shortenFields = scanReportsFields.results.map(
    (item: ScanReportField) => ({
      id: item.id,
      name: item.name,
    })
  );
  const scanReportsName = await getScanReport(id);
  const table = await getScanReportTable(tableId);

  return (
    <div className="pt-10 px-16">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/scanreports">Scan Reports</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/scanreports/${id}`}>
                {scanReportsName.dataset}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/scanreports/${id}/tables/${tableId}/`}>
                {table.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/scanreports/${id}/tables/${tableId}/update/`}
              >
                Update
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Update Table</h1>
      </div>
      <Alert className="flex items-center gap-3 bg-carrot text-white mt-4 w-1/2">
        <div>
          <AlertCircleIcon />
        </div>
        <div>
          {" "}
          Mapping Rules cannot be generated without the Person ID and Date Event
          being set.
          <br />
          Once you set these, Mapping Rules will be generated for all Concepts
          currently associated to the table.
          <br />
        </div>
      </Alert>
      <div>
        <UpdateForm scanreportFields={shortenFields} scanreportTable={table} />
      </div>
    </div>
  );
}
