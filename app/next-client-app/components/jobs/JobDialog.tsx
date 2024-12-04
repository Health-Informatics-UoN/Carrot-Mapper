"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { getScanReportTableJobs } from "@/api/scanreports";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { StageStatus, JobStage, GeneralStatus } from "@/constants/job";
import StepperComponent from "./JobStepper";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Tooltip } from "react-tooltip";

interface JobProps {
  scan_report_id: number;
  scan_report_table_id: number;
  table_name: string;
}

export default function JobDialog({
  scan_report_id,
  scan_report_table_id,
  table_name,
}: JobProps) {
  const [jobsData, setJobsData] = useState<Job[] | null>(null);
  const [generalStatus, setGeneralStatus] = useState("NOT_STARTED");

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

  useEffect(() => {
    if (
      jobsData?.some((job) => job.status && job.status.value === "IN_PROGRESS")
    ) {
      setGeneralStatus("IN_PROGRESS");
    } else if (
      jobsData?.some((job) => job.status && job.status.value === "COMPLETE")
    ) {
      setGeneralStatus("COMPLETE");
    } else if (
      jobsData?.some((job) => job.status && job.status.value === "FAILED")
    ) {
      setGeneralStatus("FAILED");
    } else if (jobsData === null) {
      setGeneralStatus("NOT_STARTED");
    }
  }, [jobsData]);

  const generalStatusFilter = GeneralStatus.find(
    (option) => option.value == generalStatus
  );
  const Icon = generalStatusFilter?.icon || X;

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
      <DialogTrigger disabled={generalStatus == "NOT_STARTED"}>
        <Button className="flex" variant={"ghost"}>
          <a
            data-tooltip-id="icon-tooltip"
            data-tooltip-content={`${generalStatusFilter?.label}`}
            data-tooltip-place="top"
            className="flex justify-center"
          >
            <Tooltip id="icon-tooltip" />
            <Icon
              className={cn(
                generalStatusFilter?.color,
                "size-4",
                Icon === Loader2 && "animate-spin"
              )}
            />
          </a>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-screen-xl overflow-auto h-3/5">
        <DialogHeader>
          <DialogTitle className="flex justify-center text-center">
            Table: {table_name} - Job Progress Details
          </DialogTitle>
        </DialogHeader>
        {jobGroups
          ? jobGroups.map((jobs) => (
              <DataTable
                columns={columns}
                data={jobs}
                count={jobs.length}
                clickableRow={false}
                normalTable={false}
              />
            ))
          : "Retrieving Jobs"}
      </DialogContent>
    </Dialog>
  );
}
