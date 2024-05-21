import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
import {
  addConceptsToResults,
  addConceptsToResultsValue,
} from "@/lib/concept-utils";
import { columns } from "./columns";

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
    page_size: 20,
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
  const scanReportsResult = addConceptsToResultsValue(
    scanReportsValues.results,
    scanReportsConcepts,
    conceptsFilter
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
                {fieldName.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Values</h1>
      </div>
      <div className="flex justify-between mt-3 flex-col sm:flex-row">
        <div className="flex gap-2">
          <Link href={`/scanreports/${id}/details/`}>
            <Button size="lg" className="text-md">
              Scan Report Details
            </Button>
          </Link>
          <Link href={`/scanreports/${id}/mapping_rules/`}>
            <Button size="lg" className="text-md">
              Rules
            </Button>
          </Link>
          <Link href={`/scanreports/${id}/tables/${tableId}/update`}>
            <Button size="lg" className="text-md">
              Edit Table
            </Button>
          </Link>
        </div>
      </div>
      <div>
        {/* TODO: Disable on click row here */}
        <DataTable
          columns={columns}
          data={scanReportsResult}
          count={scanReportsValues.count}
          Filter={filter}
        />
      </div>
    </div>
  );
}
