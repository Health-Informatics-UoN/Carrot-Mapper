"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { PanelsTopLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { columns } from "@/app/scanreports/[id]/mapping_rules/columns";
import { getSummaryRules } from "@/api/mapping-rules";
import { Loading } from "@/components/ui/loading-indicator";
import { DataTable } from "@/components/data-table";
import { Modal } from "@/components/Modal";

interface SummaryProps {
  params: {
    id: string;
  };
}

export function SummaryViewDialog({ params: { id } }: SummaryProps) {
  const [dialogOpened, setDialogOpened] = useState(true);
  const [summaryData, setSummaryData] = useState<MappingRule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (dialogOpened && !summaryData) {
      const fetchData = async () => {
        const fetchSumData = await getSummaryRules(id);
        setSummaryData(fetchSumData.results);
        setCount(fetchSumData.count);
        setLoading(false);
      };
      fetchData();
    }
  }, [dialogOpened, summaryData]);
  console.log("jsdhfkjhsdkfjh");
  return (
    <Modal>
      <DataTable
        columns={columns}
        data={summaryData || []}
        count={count || 0}
        clickableRow={false}
        defaultPageSize={2}
      />
    </Modal>
    // <Dialog open={dialogOpened} onOpenChange={setDialogOpened}>
    //   <DialogContent
    //     className={`w-full max-w-screen-2xl overflow-auto max-h-screen-2xl`}
    //   >
    //     <DialogHeader>
    //       <DialogTitle>Summary of Mapping Rules list 2123123</DialogTitle>
    //     </DialogHeader>
    //     <DialogDescription className="justify-center items-center text-center">
    //       {" "}
    //       The table below shows the list of mapping rules which have the Term
    //       Map and have the Desination Field name without "_source_concept_id"
    //     </DialogDescription>
    //     {loading ? (
    //       <div className="flex justify-center">
    //         <Loading text="Loading ..." />
    //       </div>
    //     ) : (
    //       <div>
    //         <DataTable
    //           columns={columns}
    //           data={summaryData || []}
    //           count={count || 0}
    //           clickableRow={false}
    //           defaultPageSize={20}
    //         />
    //       </div>
    //     )}
    //   </DialogContent>
    // </Dialog>
  );
}
export default SummaryViewDialog;
