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
import { PanelsTopLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { Loading } from "../ui/loading-indicator";
import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";

export function SummaryViewDialog({ scanreportId }: { scanreportId: string }) {
  const [dialogOpened, setDialogOpened] = useState(false);
  const [summaryData, setSummaryData] = useState<MappingRule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (dialogOpened && !summaryData) {
      const fetchData = async () => {
        const fetchSumData = await getSummaryRules(scanreportId);
        setSummaryData(fetchSumData.results);
        setCount(fetchSumData.count);
        setLoading(false);
      };
      fetchData();
    }
  }, [dialogOpened, summaryData]);

  return (
    <Dialog open={dialogOpened} onOpenChange={setDialogOpened}>
      <DialogTrigger asChild>
        <Button className="flex">
          Show Summary View <PanelsTopLeft className="ml-2 size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`w-full max-w-screen-2xl overflow-auto ${
          summaryData ? "h-4/5" : "h-auto"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Summary of Mapping Rules list</DialogTitle>
        </DialogHeader>
        <DialogDescription className="justify-center items-center text-center">
          {" "}
          The table below shows the list of mapping rules which have the Term
          Map and have the Desination Field name without "_source_concept_id"
        </DialogDescription>
        {loading ? (
          <div className="flex justify-center">
            <Loading text="Loading ..." />
          </div>
        ) : (
          <div>
            <DataTable
              columns={columns}
              data={summaryData || []}
              count={count || 0}
              clickableRow={false}
              defaultPageSize={20}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
