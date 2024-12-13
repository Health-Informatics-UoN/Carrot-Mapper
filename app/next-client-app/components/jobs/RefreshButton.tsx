"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { getJobs } from "@/api/scanreports";
import { toast } from "sonner";

interface RefreshJobsButtonProps {
  scanReportId: string;
  onJobsRefresh: (updatedJobs: Job[]) => void;
}

export function RefreshJobsButton({
  scanReportId,
  onJobsRefresh,
}: RefreshJobsButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Fetch jobs data
      const updatedJobs = await getJobs(scanReportId);
      if (updatedJobs) {
        onJobsRefresh(updatedJobs);
      }
    } catch (error: any) {
      toast.error("Failed to refresh jobs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="ml-2"
    >
      {isRefreshing ? (
        <>Refreshing...</>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Jobs Progress
        </>
      )}
    </Button>
  );
}
