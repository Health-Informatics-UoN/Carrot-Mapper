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
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";
import {
  getAllConceptsFiltered,
  getAllScanReportConcepts,
} from "@/api/concepts";
import { ButtonsRow } from "@/components/scanreports/ButtonsRow";
import { ConceptDataTable } from "@/components/concepts/ConceptDataTable";
import { columns } from "./columns";

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
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);

  const scanReportsName = await getScanReport(id);
  const tableName = await getScanReportTable(tableId);
  const fieldName = await getScanReportField(fieldId);
  const permissions = await getScanReportPermissions(id);
  const scanReportsValues = await getScanReportValues(query);

  const scanReportsConcepts =
    scanReportsValues.results.length > 0
      ? await getAllScanReportConcepts(
          `object_id__in=${scanReportsValues.results
            .map((item) => item.id)
            .join(",")}`,
        )
      : [];
  const conceptsFilter =
    scanReportsConcepts.length > 0
      ? await getAllConceptsFiltered(
          scanReportsConcepts?.map((item) => item.concept).join(","),
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
        <ConceptDataTable
          count={scanReportsValues.count}
          permissions={permissions}
          scanReportsConcepts={scanReportsConcepts}
          conceptsFilter={conceptsFilter}
          scanReportsData={scanReportsValues.results}
          defaultPageSize={defaultPageSize}
          columns={columns}
          clickable={false}
          filterCol="value"
          filterText="value "
        />
      </div>
    </div>
  );
}
