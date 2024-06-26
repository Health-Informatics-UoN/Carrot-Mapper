import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { columns } from "./columns";
import { getScanReports } from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { objToQuery } from "@/lib/client-utils";
import { ScanReportsTableFilter } from "@/components/scanreports/ScanReportsTableFilter";
import { FilterParameters } from "@/types/filter";

interface ScanReportsProps {
  searchParams?: { status__in: string } & FilterParameters;
}

export default async function ScanReports({ searchParams }: ScanReportsProps) {
  const defaultPageSize = 10;
  const defaultParams = {
    hidden: false,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };

  const query = objToQuery(combinedParams);
  const scanReports = await getScanReports(query);
  const filter = <ScanReportsTableFilter filter="dataset" filterText="name" />;

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
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex justify-between mt-3">
        <h1 className="text-4xl font-semibold">Scan Reports</h1>
      </div>
      <div className="my-5">
        <Tabs
          defaultValue={
            (searchParams as any)?.hidden
              ? (searchParams as any)?.hidden === "true"
                ? "archived"
                : "active"
              : "active"
          }
        >
          <TabsList className="">
            <a href="?hidden=false" className="h-full">
              <TabsTrigger value="active">Active Reports</TabsTrigger>
            </a>
            <a href="?hidden=true" className="h-full">
              <TabsTrigger value="archived">Archived Reports</TabsTrigger>
            </a>
          </TabsList>
          <TabsContent value="active">
            <DataTable
              columns={columns}
              data={scanReports.results}
              count={scanReports.count}
              Filter={filter}
            />
          </TabsContent>
          <TabsContent value="archived">
            <DataTable
              columns={columns}
              data={scanReports.results}
              count={scanReports.count}
              Filter={filter}
              defaultPageSize={defaultPageSize}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
