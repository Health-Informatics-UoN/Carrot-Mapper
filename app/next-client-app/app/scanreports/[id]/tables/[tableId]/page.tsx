import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { columns } from "./columns";
import {
  getScanReport,
  getScanReportFields,
  getScanReportPermissions,
  getScanReportTable,
} from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { FilterParameters } from "@/types/filter";
import { getConceptFilters, getScanReportConcepts } from "@/api/concepts";
import { addConceptsToResults } from "@/lib/concept-utils";
import { ButtonsRow } from "@/components/scanreports/ButtonsRow";

interface ScanReportsFieldProps {
  params: {
    id: string;
    tableId: string;
  };
  searchParams?: FilterParameters;
}

export default async function ScanReportsField({
  params: { id, tableId },
  searchParams,
}: ScanReportsFieldProps) {
  const defaultPageSize = 20;
  const defaultParams = {
    scan_report_table: tableId,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const filter = <DataTableFilter filter="name" filterText="field" />;

  const scanReportsFields = await getScanReportFields(query);
  const scanReportsName = await getScanReport(id);
  const tableName = await getScanReportTable(tableId);
  const permissions = await getScanReportPermissions(id);

  const scanReportsConcepts = await getScanReportConcepts(
    `object_id__in=${scanReportsFields.results
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
    scanReportsFields.results,
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
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Fields</h1>
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
          count={scanReportsFields.count}
          Filter={filter}
          linkPrefix="fields/"
          defaultPageSize={defaultPageSize}
        />
      </div>
    </div>
  );
}
