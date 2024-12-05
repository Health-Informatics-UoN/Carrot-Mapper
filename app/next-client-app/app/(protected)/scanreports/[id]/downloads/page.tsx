import { FilterParameters } from "@/types/filter";
import { objToQuery } from "@/lib/client-utils";
import { DataTable } from "@/components/data-table";
import { list } from "@/api/files";
import { columns } from "./columns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Loader2, LucideIcon } from "lucide-react";
import { getJobs } from "@/api/scanreports";
import { GeneralStatus } from "@/constants/job";
import { cn } from "@/lib/utils";

interface DownloadsProps {
  params: {
    id: string;
  };
  searchParams?: FilterParameters;
}

export const revalidate = 30;

export default async function Downloads({
  params: { id },
  searchParams,
}: DownloadsProps) {
  const defaultPageSize = 20;
  const defaultParams = {
    p: 1,
    page_size: defaultPageSize,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const downloadingJob = await getJobs(id, "download");
  const filesList = await list(Number(id), query);

  let Icon = null;
  let currentJob: Job | null = null;

  if (downloadingJob) {
    currentJob = downloadingJob[0];

    if (currentJob.status.value == "IN_PROGRESS") {
      const currentStatusOption = GeneralStatus.find(
        (option) => option.value == currentJob?.status.value
      );
      Icon = currentStatusOption?.icon || Loader2;
    }
  }
  console.log("🚀 ~ currentJob121212:", currentJob);
  return (
    <div>
      {filesList && (
        <DataTable
          columns={columns}
          data={filesList.results}
          count={filesList.count}
          clickableRow={false}
          Filter={
            <Alert
              className={cn(
                "max-w-sm h-10 flex items-center border-2",
                Icon ? "border-orange-400" : "border-green-300"
              )}
            >
              <AlertDescription className="flex items-center">
                {Icon && (
                  <Icon className="animate-spin text-orange-500 dark:text-orange-500 size-5 mr-2" />
                )}

                <div>{currentJob?.details}</div>
              </AlertDescription>
            </Alert>
          }
          defaultPageSize={defaultPageSize}
        />
      )}
    </div>
  );
}
