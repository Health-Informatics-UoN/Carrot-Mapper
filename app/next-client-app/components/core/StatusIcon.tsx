"use client";

import { cn } from "@/lib/utils";
import { Loader2, LucideIcon, Check, X, CircleSlash } from "lucide-react";
import { Tooltip } from "react-tooltip";

export interface StatusOption {
  label: string;
  icon: string;
  value: string;
  color: string;
}

export function StatusIcon({
  statusOptions,
  status,
}: {
  statusOptions: StatusOption[];
  status: { value: string };
}) {
  const statusInfo = statusOptions.find(
    (option) => option.value === status.value
  );

  const iconMap: { [key: string]: LucideIcon } = {
    Loader2,
    Check,
    X,
    CircleSlash,
  };
  const Icon = statusInfo?.icon ? iconMap[statusInfo.icon] : null;

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
          statusInfo?.color,
          "size-4",
          Icon === Loader2 && "animate-spin"
        )}
      />
    </a>
  );
}
