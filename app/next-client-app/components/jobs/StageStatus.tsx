"use client";

import { StageStatus } from "@/constants/job";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Tooltip } from "react-tooltip";

// TODO: Generalise the status options type then COMBINE with other similar components
export function Status({ status }: { status: Status }) {
  const statusInfo = StageStatus.find(
    (option) => option.value === status.value
  );

  const Icon = statusInfo?.icon;

  if (!Icon) {
    return null;
  }

  return (
    <a
      data-tooltip-id="icon-tooltip"
      data-tooltip-content={`${statusInfo?.label}`}
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
