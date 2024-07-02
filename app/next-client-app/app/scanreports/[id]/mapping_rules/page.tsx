import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChartHorizontalBig,
  BookText,
  ChevronDown,
  ChevronRight,
  FileJson,
  FilePieChart,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterParameters } from "@/types/filter";
import { getScanReport } from "@/api/scanreports";
import { getMappingRulesList } from "@/api/mapping-rules";
import { objToQuery } from "@/lib/client-utils";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GetFile } from "./get-file";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScanReportsMappingRulesProps {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
}

export default async function ScanReportsMappingRules({
  params: { id },
  searchParams,
}: ScanReportsMappingRulesProps) {
  const defaultPageSize = 30;
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const scanReport = await getScanReport(id);
  const mappingRulesList = await getMappingRulesList(query);

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
                {scanReport.dataset}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/scanreports/${id}/mapping_rules`}>
                Mapping Rules
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Mapping Rules</h1>
      </div>
      <div className="flex justify-between mt-3 flex-col sm:flex-row">
        <div className="flex gap-2">
          <Button>
            Show Summary View
            <BookText className="ml-2 size-4" />
          </Button>
          <Button>
            Analyse Rules <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                View Map Diagram
                <BarChartHorizontalBig className="ml-2 size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1200px]">
              <ScrollArea className="w-[1000px] h-[400px]">
                <GetFile
                  name="Download Map Diagram"
                  scanreportId={id}
                  query={query}
                  variant="diagram"
                  type="image/svg+xml"
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[230px]">
              <DropdownMenuItem>
                <GetFile
                  name="Download Map Diagram"
                  scanreportId={id}
                  query={query}
                  variant="button"
                  type="image/svg+xml"
                />
                <DropdownMenuShortcut>
                  <FilePieChart />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <GetFile
                  name="Download Mapping JSON"
                  scanreportId={id}
                  query={query}
                  variant="button"
                  type="application/json"
                />
                <DropdownMenuShortcut>
                  <FileJson />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <GetFile
                  name="Download Mapping CSV"
                  scanreportId={id}
                  query={query}
                  variant="button"
                  type="text/csv"
                />
                <DropdownMenuShortcut>
                  <FileSpreadsheet />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={mappingRulesList.results}
          count={mappingRulesList.count}
          clickableRow={false}
        />
      </div>
    </div>
  );
}
