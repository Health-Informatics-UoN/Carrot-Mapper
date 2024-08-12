"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  BarChartHorizontalBig,
  ChevronDown,
  FileJson,
  FilePieChart,
  FileSpreadsheet,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GetFile } from "@/app/(protected)/scanreports/[id]/mapping_rules/get-file";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RulesButton({
  scanreportId,
  query,
}: {
  scanreportId: string;
  query: string;
}) {
  return (
    <div className="hidden md:flex gap-2 justify-end w-full mr-2">
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              View Map Diagram
              <BarChartHorizontalBig className="ml-2 size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[1200px]">
            <ScrollArea className="w-auto h-[400px]">
              <GetFile
                name="Download Map Diagram"
                scanreportId={scanreportId}
                query={query}
                variant="diagram"
                type="image/svg+xml"
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Download <ChevronDown className="ml-2 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[170px]">
            <DropdownMenuItem>
              <GetFile
                name="Map Diagram"
                scanreportId={scanreportId}
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
                name="Mapping JSON"
                scanreportId={scanreportId}
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
                name="Mapping CSV"
                scanreportId={scanreportId}
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
  );
}
