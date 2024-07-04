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
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";
import {
  getAllConceptsFiltered,
  getAllScanReportConcepts,
} from "@/api/concepts";
import { ButtonsRow } from "@/components/scanreports/ButtonsRow";
import { ConceptDataTable } from "@/components/concepts/ConceptDataTable";

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

  const scanReportsFields = await getScanReportFields(query);
  const scanReportsName = await getScanReport(id);
  const tableName = await getScanReportTable(tableId);
  const permissions = await getScanReportPermissions(id);

  const scanReportsConcepts =
    scanReportsFields.results.length > 0
      ? await getAllScanReportConcepts(
          `object_id__in=${scanReportsFields.results
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
        <ConceptDataTable
          count={scanReportsFields.count}
          permissions={permissions}
          scanReportsConcepts={scanReportsConcepts}
          conceptsFilter={conceptsFilter}
          scanReportsData={scanReportsFields.results}
          defaultPageSize={defaultPageSize}
          columns={columns}
          filterCol="name"
          filterText="field "
          linkPrefix="fields/"
        />
      </div>
    </div>
  );
}
