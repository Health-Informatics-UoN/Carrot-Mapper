"use client";
import { downloadScanReport } from "@/api/scanreports";
import { Button } from "../ui/button";
import { Download } from "lucide-react";

interface DownloadProp {
  scanReportId: string;
}

export const DownloadButton = ({ scanReportId }: DownloadProp) => {
  const handleDownload = async () => {
    try {
      const response = await downloadScanReport(scanReportId);
      console.log(response);
    } catch (error) {
      console.error("Failed to download scan report:", error);
    }
  };

  return (
    <Button variant={"outline"} onClick={handleDownload}>
      Export Scan Report
      <Download className="ml-2 size-4" />
    </Button>
  );
};
