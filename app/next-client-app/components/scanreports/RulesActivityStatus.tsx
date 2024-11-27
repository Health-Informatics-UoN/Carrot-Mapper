"use client";

import { RulesActivities } from "@/constants/rulesActivity";
import { UploadStatusOptions } from "@/constants/scanReportStatus";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Tooltip } from "react-tooltip";

export function RulesActivityStatus({ activity }: { activity: Activity }) {
  const statusInfo = RulesActivities.find(
    (option) => option.activity === activity.activity
  );
  console.log("🚀 ~ RulesActivityStatus ~ statusInfo:", statusInfo);

  const Icon = statusInfo?.icon;

  if (!Icon) {
    return null;
  }

  return (
    <a
      data-tooltip-id="icon-tooltip"
      data-tooltip-content={`${statusInfo?.display_name}`}
      data-tooltip-place="top"
      className="flex justify-center"
    >
      <Tooltip id="icon-tooltip" />
      <Icon
        className={cn(
          statusInfo.color,
          "size-4",
          Icon === Loader2 && "animate-spin"
        )}
      />
    </a>
  );
}
