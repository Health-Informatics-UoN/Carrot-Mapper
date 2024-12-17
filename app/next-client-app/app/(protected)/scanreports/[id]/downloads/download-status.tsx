"use client";
import { StatusIcon } from "@/components/core/StatusIcon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GeneralStatus } from "@/constants/job";
import { cn } from "@/lib/utils";

export function DownloadStatus({ lastestJob }: { lastestJob: Job }) {
  return (
    <Alert
      className={cn(
        "max-w-sm h-10 flex items-center border-2",
        lastestJob.status.value == "IN_PROGRESS"
          ? "border-orange-400"
          : "border-red-400"
      )}
    >
      <AlertDescription className="flex items-center">
        <StatusIcon status={lastestJob.status} statusOptions={GeneralStatus} />
        <div className="ml-2">{lastestJob?.details}</div>
      </AlertDescription>
    </Alert>
  );
}