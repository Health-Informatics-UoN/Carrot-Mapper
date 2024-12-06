"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GeneralStatus } from "@/constants/job";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

export function DownloadStatus({ lastestJob }: { lastestJob: Job }) {
  const statusOption = GeneralStatus.find(
    (option) => option.value == lastestJob.status.value
  );
  const Icon = statusOption?.icon || X;
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
        <Icon
          className={cn(
            statusOption?.color,
            "size-5 mr-2",
            Icon === Loader2 && "animate-spin"
          )}
        />
        <div>{lastestJob?.details}</div>
      </AlertDescription>
    </Alert>
  );
}
