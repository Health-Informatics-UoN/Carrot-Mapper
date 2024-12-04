"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { getScanReportTableJobs } from "@/api/scanreports";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { StageStatus, JobStage } from "@/constants/job";
import StepperComponent from "./JobStepper";

interface JobProps {
  scan_report_id: number;
  scan_report_table_id: number;
}

export default function JobDialog({
  scan_report_id,
  scan_report_table_id,
}: JobProps) {
  const [jobsData, setJobsData] = useState<Job[] | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const jobs = await getScanReportTableJobs(
        scan_report_id,
        scan_report_table_id
      );
      setJobsData(jobs);
    };
    fetchJobs();
  }, [scan_report_id, scan_report_table_id]);

  let jobGroups: Job[][] = [];

  if (jobsData) {
    let jobs: Job[] = [];
    jobsData.forEach((job) => {
      jobs.push(job);
      if (jobs.length === 3) {
        // Sort jobs based on the "created_at" field
        jobs.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        jobGroups.push(jobs);
        jobs = [];
      }
    });
  }

  return (
    <Dialog>
      {/* Render this based on the the status list of the jobs list */}
      {/* Disabled when nothing there/not started */}
      <DialogTrigger>View Details</DialogTrigger>
      <DialogContent className="max-w-screen-xl overflow-auto h-4/5">
        <DialogHeader>
          <DialogTitle className="flex justify-center text-center">
            Scan report table #{scan_report_table_id} - Job Progress Details
          </DialogTitle>
        </DialogHeader>
        {jobGroups
          ? jobGroups.map((jobs) => (
              <DataTable columns={columns} data={jobs} count={jobs.length} />
            ))
          : "Retrieving Jobs"}
      </DialogContent>
    </Dialog>
  );
}
