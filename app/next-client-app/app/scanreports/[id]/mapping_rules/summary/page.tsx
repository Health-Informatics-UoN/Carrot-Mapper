import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
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

export default async function SummaryViewDialog({
  params: { id },
  searchParams,
}: SummaryProps) {
  const defaultPageSize = 20;
  const defaultParams = {
    id: id,
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);

  const summaryRules = await getSummaryRules(query);
  // TODO: Make the loading state, if possible
  // TODO: When users use pagination here, the dialog modal will appear and they will have to do pagiantion there instead!?
  return (
    <div className="p-5">
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
          <DataTable
            columns={columns}
            data={summaryRules.results}
            count={summaryRules.count}
            clickableRow={false}
            defaultPageSize={defaultPageSize}
          />
        </Dialog>
      </div>
    </div>
  );
}
