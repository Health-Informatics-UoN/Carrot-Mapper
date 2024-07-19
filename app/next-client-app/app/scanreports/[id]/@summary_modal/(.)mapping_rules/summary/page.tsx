"use client";
import { useState, useEffect } from "react";
import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";
import { DataTable } from "@/components/data-table";
import { Modal } from "@/components/Modal";
import { FilterParameters } from "@/types/filter";
import { objToQuery } from "@/lib/client-utils";

interface SummaryProps {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
}

export default function SummaryViewDialog({
  params: { id },
  searchParams,
}: SummaryProps) {
  const [loading, setLoading] = useState(true);
  const [summaryRules, setSummaryRules] =
    useState<PaginatedResponse<MappingRule>>();

  const defaultPageSize = 20;
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  // TODO: Test stability of the page when return from the modal. Sometimes it will break, possibly due to "use client" structure
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSummaryRules(query);
        setSummaryRules(data);
      } catch (error) {
        console.error("Error fetching summary rules:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [query]);

  return (
    <Modal modal="summary">
      {loading ? (
        <div className="flex justify-center">
          <Loading text="Loading ..." />
        </div>
      ) : (
        <div>
          {summaryRules && (
            <DataTable
              columns={columns}
              data={summaryRules.results}
              count={summaryRules.count}
              clickableRow={false}
              defaultPageSize={defaultPageSize}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
