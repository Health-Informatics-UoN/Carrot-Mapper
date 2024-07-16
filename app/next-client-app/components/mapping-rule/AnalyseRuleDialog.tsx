"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { BarChart3 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { getAnalyseRulesData } from "@/api/mapping-rules";
import { AnalyseColumns } from "./AnalyseColumns";

export function AnalyseRuleDialog({ scanreportId }: { scanreportId: string }) {
  const [dialogOpened, setDialogOpened] = useState(false);
  const [analyseData, setAnalyseData] = useState<AnalyseRuleData[] | null>(
    null
  );

  useEffect(() => {
    if (dialogOpened) {
      const fetchData = async () => {
        const analyseDataFetch = await getAnalyseRulesData(scanreportId);
        setAnalyseData(analyseDataFetch.data);
      };
      fetchData();
    }
  }, [dialogOpened, scanreportId]);

  return (
    <Dialog open={dialogOpened} onOpenChange={setDialogOpened}>
      <DialogTrigger asChild>
        <Button className="flex">
          Analyse Rules <BarChart3 className="ml-2 size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-screen-2xl overflow-scroll h-4/5">
        <DialogHeader>
          <DialogTitle>Analyse Rules</DialogTitle>
        </DialogHeader>
        <DialogDescription className="justify-center items-center text-center">
          {" "}
          This analysis compares this Scanreport to all other ScanReports,
          finding ancestor and descendants of each, and reporting the results
          including any mismatched Concepts found.
        </DialogDescription>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="my-0">
            <DataTable
              columns={AnalyseColumns}
              data={analyseData || []}
              count={20} // TODO: Do this need pagination? If so, how to add that to backend?
              clickableRow={false}
              defaultPageSize={20}
            />
          </div>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
