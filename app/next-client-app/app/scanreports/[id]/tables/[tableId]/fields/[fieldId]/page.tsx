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
  getScanReportPermissions,
  getScanReportTable,
  getScanReportValues,
} from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { FilterParameters } from "@/types/filter";
import { getConceptFilters, getScanReportConcepts } from "@/api/concepts";
import { addConceptsToResults } from "@/lib/concept-utils";
import { columns } from "./columns";
import { ButtonsRow } from "@/components/scanreports/ButtonsRow";

interface ScanReportsValueProps {
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
}: ScanReportsValueProps) {
  const defaultPageSize = 30;
  const defaultParams = {
    scan_report_field: fieldId,
    page_size: defaultPageSize,
    ordering: "value",
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);

  const filter = <DataTableFilter filter="value" filterText="value" />;

  const scanReportsValues = await getScanReportValues(query);
  const scanReportsName = await getScanReport(id);
  const tableName = await getScanReportTable(tableId);
  const fieldName = await getScanReportField(fieldId);
  const permissions = await getScanReportPermissions(id);
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
  const scanReportsResult = addConceptsToResults(
    scanReportsValues.results,
    scanReportsConcepts,
    conceptsFilter,
    permissions
  );

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
                href={`/scanreports/${id}/tables/${tableId}/fields/${fieldId}/`}
              >
                {fieldName?.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Values</h1>
      </div>
      <ButtonsRow
        scanreportId={parseInt(id)}
        tableId={parseInt(tableId)}
        permissions={permissions.permissions}
      />
      <div>
        <DataTable
          columns={columns}
          data={scanReportsResult}
          count={scanReportsValues.count}
          Filter={filter}
          clickableRow={false}
          defaultPageSize={defaultPageSize}
        />
      </div>
    </div>
  );
}
