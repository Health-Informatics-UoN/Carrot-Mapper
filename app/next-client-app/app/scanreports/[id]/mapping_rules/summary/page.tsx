"use client";
import { useState, useEffect } from "react";
import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";
import { DataTable } from "@/components/data-table";
import { FilterParameters } from "@/types/filter";
import { objToQuery } from "@/lib/client-utils";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  // TODO: Why when I use pagination here, the modal appear?
  // Problem: Somehow it will activate the modal and its pagination of the modal through the common URL
  // Possible solution: The pagination should be deactivated here, because the purpose of this is sharing the specific info/page
  return (
    <div className="p-5">
      {loading ? (
        <div className="flex justify-center">
          <Loading text="Loading ..." />
        </div>
      ) : (
        <div>
          <Dialog>
            <DialogHeader>
              <DialogTitle>Summary of Mapping Rules list</DialogTitle>
              <DialogDescription className="justify-center items-center text-center">
                {" "}
                The table below shows the list of mapping rules which have the
                Term Map and have the Desination Field name without
                "_source_concept_id"
              </DialogDescription>
            </DialogHeader>
            {summaryRules && (
              <DataTable
                columns={columns}
                data={summaryRules.results}
                count={summaryRules.count}
                clickableRow={false}
                defaultPageSize={defaultPageSize}
              />
            )}
          </Dialog>
        </div>
      )}
    </div>
  );
}
