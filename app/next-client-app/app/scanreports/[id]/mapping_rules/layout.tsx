import { getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { Button } from "@/components/ui/button";
import { TabGroup } from "@/components/ui/layout/tab-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChartHorizontalBig,
  ChevronDown,
  FileJson,
  FilePieChart,
  FileSpreadsheet,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GetFile } from "./get-file";
import { ScrollArea } from "@/components/ui/scroll-area";
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";

export default async function MappingRuleLayout({
  params,
  children,
}: Readonly<{
  params: { id: string; searchParams: FilterParameters };
  children: React.ReactNode;
}>) {
  const permissions = await getScanReportPermissions(params.id);
  const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];
  const defaultPageSize = 30;
  const defaultParams = {
    id: params.id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...params.searchParams };
  const query = objToQuery(combinedParams);

  if (
    !requiredPermissions.some((permission) =>
      permissions.permissions.includes(permission)
    )
  ) {
    return (
      <div className="pt-10 px-16">
        <Forbidden />
      </div>
    );
  }
  return (
    <>
      <div className="flex justify-between">
        <TabGroup
          path={`/scanreports/${params.id}/mapping_rules`}
          items={[
            {
              text: "General View",
            },
            {
              text: "Summary View",
              slug: "summary",
            },
          ]}
        />
        <div className="flex gap-2">
          {/* TODO: Need to test again these buttons */}
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
                  scanreportId={params.id}
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
                  scanreportId={params.id}
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
                  scanreportId={params.id}
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
                  scanreportId={params.id}
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
      <div>{children}</div>
    </>
  );
}
