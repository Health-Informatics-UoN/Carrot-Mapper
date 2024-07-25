"use client";

import { ScanReportStatus } from "@/components/scanreports/ScanReportStatus";

export function Status({
  id,
  status,
  dataset,
}: {
  id: number;
  status: string;
  dataset: string;
}) {
  return (
    <ScanReportStatus id={id} status={status} dataset={dataset} onLayout />
  );
}
