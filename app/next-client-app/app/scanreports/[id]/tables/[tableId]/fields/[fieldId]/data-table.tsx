import {
  getScanReportPermissions,
  getScanReportValues,
} from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { getConceptFilters, getScanReportConcepts } from "@/api/concepts";
import { addConceptsToResults } from "@/lib/concept-utils";
import { columns } from "./columns";
import { FilterParameters } from "@/types/filter";

interface ScanReportsValueProps {
  id: string;
  fieldId: string;
  searchParams?: FilterParameters;
}

export async function DataTableTest({
  id,
  fieldId,
  searchParams,
}: ScanReportsValueProps) {
  const defaultPageSize = 30;
  const defaultParams = {
    scan_report_field: fieldId,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);

  const filter = <DataTableFilter filter="value" filterText="value" />;

  const scanReportsValues = await getScanReportValues(query);
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
  );
}
