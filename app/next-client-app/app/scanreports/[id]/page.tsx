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
import { getScanReport, getScanReportsTables } from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";

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
  const scanReportsName = await getScanReport(id);

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
            <Button size="lg" className="text-md">
              Scan Report Details
            </Button>
          </Link>
          <Link href={`/scanreports/${id}/mapping_rules/`}>
            <Button size="lg" className="text-md">
              Rules
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            className="text-md bg-carrot-secondary hover:bg-carrot-secondary-50"
          >
            {/* need to config the api */}
            <a href={`api/scanreports/${id}/download/`} download>
              Download Scan Report File
            </a>
          </Button>
          <Button size="lg" className="text-md">
            {/* need to config the api */}
            <a href={`api/scanreports/${id}/download/`} download>
              Download Data Dictionary File
            </a>
          </Button>
        </div>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={scanReportsTables.results}
          count={scanReportsTables.count}
          filter="name"
          linkPrefix="/tables/"
        />
      </div>
    </div>
  );
}
