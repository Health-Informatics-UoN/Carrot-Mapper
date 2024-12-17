"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { EditButton } from "@/components/scanreports/EditButton";
import JobDialog from "@/components/jobs/JobDialog";
import { FindGeneralStatus, DivideJobs } from "@/components/jobs/JobUtils";

export const columns: ColumnDef<ScanReportTable>[] = [
  {
    id: "Name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" sortName="name" />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "Person ID",
    accessorKey: "person_id",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Person ID"
        sortName="person_id"
      />
    ),
    cell: ({ row }) => {
      const { person_id } = row.original;
      return <>{person_id?.name}</>;
    },
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Event Date",
    accessorKey: "date_event",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Date Event"
        sortName="date_event"
      />
    ),
    cell: ({ row }) => {
      const { date_event } = row.original;
      return <>{date_event?.name}</>;
    },
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "jobs",
    header: () => <div className="text-center">Jobs Progress</div>,
    cell: ({ row }) => {
      const { id, name, jobs } = row.original;
      // Filter the jobs based on the scanReportTable ID
      const jobsData: Job[] = jobs.filter((job) => job.scan_report_table == id);
      // Divide jobs into jobs groups
      const jobGroups = DivideJobs(jobsData);
      // Get the general status of the table for the lastest run
      const generalStatus = FindGeneralStatus(jobGroups[0]);

      return (
        <div className="flex justify-center">
          <JobDialog
            jobGroups={jobGroups}
            table_name={name}
            generalStatus={generalStatus}
          />
        </div>
      );
    },
  },
  {
    id: "edit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const { id, scan_report, permissions, jobs } = row.original;
      // Filter the jobs based on the scanReportTable ID
      const jobsData: Job[] = jobs.filter((job) => job.scan_report_table == id);
      // Divide jobs into jobs groups
      const jobGroups = DivideJobs(jobsData);
      // Get the general status of the table for the lastest run
      const generalStatus = FindGeneralStatus(jobGroups[0]);
      return (
        <EditButton
          scanreportId={scan_report}
          tableId={id}
          type="table"
          permissions={permissions}
          generalStatus={generalStatus}
        />
      );
    },
  },
];
