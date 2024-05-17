import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { columns } from "./columns";
import {
  getScanReport,
  getScanReportConcept,
  getScanReportFields,
  getScanReportTable,
} from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { FilterParameters } from "@/types/filter";
import { getConceptFilters } from "@/api/concepts";
import { addConceptsToResults } from "@/lib/concept-utils";

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
  const defaultParams = {
    scan_report_table: tableId,
  };

  const combinedParams = { ...defaultParams, ...searchParams };

  const query = objToQuery(combinedParams);
  const scanReportsTables = await getScanReportFields(query);
  const scanReportsName = await getScanReport(id);
  const tableName = await getScanReportTable(tableId);
  const filter = <DataTableFilter filter="name" filterText="field" />;
  const scanReportsConcepts = await getScanReportConcept(
    `object_id__in=${scanReportsTables.results
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
    scanReportsTables.results,
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
              <BreadcrumbLink href={`/scanreports/${id}/tables/${tableId}`}>
                {tableName.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Fields</h1>
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
        <DataTable
          columns={columns}
          data={scanReportsResult}
          count={scanReportsTables.count}
          Filter={filter}
          linkPrefix="fields/"
        />
      </div>
    </div>
  );
}
