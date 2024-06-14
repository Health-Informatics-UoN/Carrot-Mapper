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
import { getMapDiagram, getMappingRulesList } from "@/api/mapping-rules";
import { objToQuery } from "@/lib/client-utils";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DownloadBtn } from "./get-file";

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
  const diagram = await getMapDiagram(id, query, "svg");
  const json = await getMapDiagram(id, query, "json");
  const csv = await getMapDiagram(id, query, "csv");

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
            <DialogContent>
              <></>
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
                <DownloadBtn
                  name="Download Map Diagram"
                  data={diagram}
                  type="image/svg+xml"
                />
                <DropdownMenuShortcut>
                  <FilePieChart />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DownloadBtn
                  name="Download Mapping JSON"
                  data={json}
                  type="application/json"
                />
                <DropdownMenuShortcut>
                  <FileJson />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DownloadBtn
                  name="Download Mapping CSV"
                  data={csv}
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
