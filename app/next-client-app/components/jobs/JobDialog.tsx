"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { getScanReportTableJobs } from "@/api/scanreports";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { StageStatus, JobStage } from "@/constants/job";

interface JobProps {
  scan_report_id: number;
  scan_report_table_id: number;
}

export default function JobDialog({
  scan_report_id,
  scan_report_table_id,
}: JobProps) {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const jobs = await getScanReportTableJobs(
        scan_report_id,
        scan_report_table_id
      );
      setJobs(jobs);
    };
    fetchJobs();
  }, [scan_report_id, scan_report_table_id]);

  const statusList = jobs?.map((job) => job.status.value);
  const generalStatus = "NOT_STARTED";

  console.log("🚀 ~ statusList:", statusList);

  return (
    <Dialog>
      {/* Render this based on the the status list of the jobs list */}
      {/* Disabled when nothing there/not started */}
      <DialogTrigger>View Details</DialogTrigger>
      <DialogContent className="max-w-screen-xl">
        <DialogHeader>
          <DialogTitle className="flex justify-center text-center">
            Scan report table #{scan_report_table_id} - Job Progress Details
          </DialogTitle>
        </DialogHeader>
        {jobs ? (
          <DataTable columns={columns} data={jobs} count={jobs.length} />
        ) : (
          "Retrieving Jobs"
        )}
      </DialogContent>
    </Dialog>
  );
}
