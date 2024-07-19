"use client";
import { useState, useEffect } from "react";
import { columns } from "@/app/scanreports/[id]/mapping_rules/analyse/columns";
import { getAnalyseRules } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";
import { DataTable } from "@/components/data-table";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnalyseProps {
  params: {
    id: string;
  };
  // searchParams?: FilterParameters;
}

export default function AnalyseRulesDialog({
  params: { id },
}: // searchParams,
AnalyseProps) {
  const [loading, setLoading] = useState(true);
  const [analyseRulesData, setAnalyseRulesData] = useState<
    AnalyseRuleData[] | null
  >();
  const defaultPageSize = 20;
  // TODO: Need to do server-side pagination here
  // TODO: Clean the types
  // TODO: How to the stop the process when the dialog is closed?
  // TODO: How to make the process of fetching faster??
  useEffect(() => {
    async function fetchData() {
      try {
        const analyseDataFetch = await getAnalyseRules(id);
        setAnalyseRulesData(analyseDataFetch.data);
      } catch (error) {
        console.error("Error analyse rules:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  return (
    <div className="p-5">
      <div>
        <Dialog>
          <DialogHeader>
            <DialogTitle>Analyse Rules</DialogTitle>
            <DialogDescription className="justify-center items-center text-center">
              {" "}
              This analysis compares this Scanreport to all other ScanReports,
              finding ancestors and descendants of each, and reporting the
              results including any mismatched Concepts found.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center mt-10">
              <Loading text="Analysing ..." />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={analyseRulesData || []}
              count={analyseRulesData ? analyseRulesData.length : 0}
              clickableRow={false}
              defaultPageSize={defaultPageSize}
            />
          )}
        </Dialog>
      </div>
    </div>
  );
}
