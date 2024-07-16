"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { BarChart3, Plus } from "lucide-react";

import { DialogDescription } from "@radix-ui/react-dialog";
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
      <DialogContent className="w-full max-w-screen-2xl">
        <DialogHeader>
          <DialogTitle>Analyse Rules</DialogTitle>
        </DialogHeader>
        {/* <DialogDescription className="justify-center items-center text-center">
          {" "}
          Notice: Data Partner is set as the chosen Data Partner in the previous
          form.
        </DialogDescription> */}
        <Suspense fallback={<div>Loading...</div>}>
          <DataTable
            columns={AnalyseColumns}
            data={analyseData || []}
            count={20}
            clickableRow={false}
            defaultPageSize={20}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
