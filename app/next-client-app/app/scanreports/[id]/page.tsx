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
import { getScanReportName, getScanReportsTables } from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { BookText, ChevronRight, Download } from "lucide-react";

type Props = {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
};

export default async function ScanReportsTable({
  params: { id },
  searchParams,
}: Props) {
  const defaultParams = {
    scan_report: id,
  };

  const combinedParams = { ...defaultParams, ...searchParams };

  const query = objToQuery(combinedParams);
  const scanReportsTables = await getScanReportsTables(query);
  const scanReportsName = await getScanReportName(id);
  const filter = <DataTableFilter filter="name" />;

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
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Tables</h1>
      </div>
      <div className="flex justify-between mt-3 flex-col sm:flex-row">
        <div className="flex gap-2">
          <Link href={`/scanreports/${id}/details/`}>
            <Button>
              Scan Report Details
              <BookText className="ml-2 size-4" />
            </Button>
          </Link>
          <Link href={`/scanreports/${id}/mapping_rules/`}>
            <Button>
              Rules
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Button variant={"outline"}>
            {/* need to config the api */}
            <a href={`api/scanreports/${id}/download/`} download>
              Export Scan Report
            </a>
            <Download className="ml-2 size-4" />
          </Button>
          <Button variant={"outline"}>
            {/* need to config the api */}
            <a href={`api/scanreports/${id}/download/`} download>
              Export Data Dictionary
            </a>
            <Download className="ml-2 size-4" />
          </Button>
        </div>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={scanReportsTables.results}
          count={scanReportsTables.count}
          Filter={filter}
          linkPrefix="tables/"
        />
      </div>
    </div>
  );
}
