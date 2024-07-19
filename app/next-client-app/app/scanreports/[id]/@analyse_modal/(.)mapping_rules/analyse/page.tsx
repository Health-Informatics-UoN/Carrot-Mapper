"use client";
import { useState, useEffect } from "react";
import { getAnalyseRules } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";
import { DataTable } from "@/components/data-table";
import { Modal } from "@/components/Modal";
import { columns } from "@/app/scanreports/[id]/mapping_rules/analyse/columns";

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
    <Modal modal="analyse">
      {loading ? (
        <div className="flex justify-center">
          <Loading text="Analysing ..." />
        </div>
      ) : (
        <div>
          {analyseRulesData && (
            <DataTable
              columns={columns}
              data={analyseRulesData}
              count={analyseRulesData.length}
              clickableRow={false}
              defaultPageSize={defaultPageSize}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
