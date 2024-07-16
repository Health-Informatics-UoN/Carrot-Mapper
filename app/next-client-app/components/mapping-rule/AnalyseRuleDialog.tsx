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
import { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { getAnalyseRulesData } from "@/api/mapping-rules";
import { AnalyseColumns } from "./AnalyseColumns";
import { Loading } from "../ui/loading-indicator";

export function AnalyseRuleDialog({ scanreportId }: { scanreportId: string }) {
  const [dialogOpened, setDialogOpened] = useState(false);
  const [analyseData, setAnalyseData] = useState<AnalyseRuleData[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dialogOpened && !analyseData) {
      const fetchData = async () => {
        // TODO: Term map show the new added concept on Fields + Values or only Values
        // TODO: How to the stop the process when the dialog is closed?
        // TODO: How to make the process of fetching faster??
        // TODO: Add pagination to the backend of analyseRule
        // TODO: How to control the pagination in this case of dialog, not a page with separate url
        const analyseDataFetch = await getAnalyseRulesData(scanreportId);
        setAnalyseData(analyseDataFetch.data);
        setLoading(false);
      };
      fetchData();
    }
  }, [dialogOpened, scanreportId, analyseData]);

  return (
    <Dialog open={dialogOpened} onOpenChange={setDialogOpened}>
      <DialogTrigger asChild>
        <Button className="flex">
          Analyse Rules <BarChart3 className="ml-2 size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-screen-2xl overflow-auto h-4/5">
        <DialogHeader>
          <DialogTitle>Analyse Rules</DialogTitle>
        </DialogHeader>
        <DialogDescription className="justify-center items-center text-center">
          {" "}
          This analysis compares this Scanreport to all other ScanReports,
          finding ancestor and descendants of each, and reporting the results
          including any mismatched Concepts found.
        </DialogDescription>
        {loading ? (
          <div className="flex justify-center">
            <Loading text="Analysing ..." />
          </div>
        ) : (
          <div>
            <DataTable
              columns={AnalyseColumns}
              data={analyseData || []}
              count={analyseData ? analyseData.length : 0}
              clickableRow={false}
              defaultPageSize={20}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
