import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getScanReport,
  getScanReportField,
  getScanReportTable,
  getScanReportValues,
} from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { FilterParameters } from "@/types/filter";
import { getConceptFilters, getScanReportConcepts } from "@/api/concepts";
import { addConceptsToResults } from "@/lib/concept-utils";
import { ButtonsRow } from "@/components/scanreports/ButtonsRow";
import { AlertCircleIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";

interface ScanReportsFieldProps {
  params: {
    id: string;
    tableId: string;
    fieldId: string;
  };
  searchParams?: FilterParameters;
}

export default async function ScanReportsValue({
  params: { id, tableId, fieldId },
  searchParams,
}: ScanReportsFieldProps) {
  const defaultParams = {
    scan_report_field: fieldId,
    page_size: 25,
  };
  const combinedParams = { ...defaultParams, ...searchParams };

  const query = objToQuery(combinedParams);

  const scanReportsValues = await getScanReportValues(query);
  const scanReportsName = await getScanReport(id);
  const tableName = await getScanReportTable(tableId);
  const fieldName = await getScanReportField(fieldId);
  const filter = <DataTableFilter filter="value" filterText="value" />;
  const scanReportsConcepts = await getScanReportConcepts(
    `object_id__in=${scanReportsValues.results
      .map((item) => item.id)
      .join(",")}`
  );
  const conceptsFilter =
    scanReportsConcepts.length > 0
      ? await getConceptFilters(
          scanReportsConcepts?.map((item) => item.concept).join(",")
        )
      : [];

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
                {tableName.name}
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
      <Alert className="flex items-center gap-3 bg-carrot-600 text-white mt-4">
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
    </div>
  );
}
