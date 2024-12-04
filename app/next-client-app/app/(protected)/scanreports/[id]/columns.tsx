"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { EditButton } from "@/components/scanreports/EditButton";
import JobDialog from "@/components/jobs/JobDialog";

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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Jobs Progress" />
    ),
    cell: ({ row }) => {
      const { id, scan_report, name } = row.original;
      return (
        <JobDialog
          scan_report_id={scan_report}
          scan_report_table_id={id}
          table_name={name}
        />
      );
    },
  },
  {
    id: "edit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const { id, scan_report, permissions } = row.original;
      return (
        <EditButton
          scanreportId={scan_report}
          tableId={id}
          type="table"
          permissions={permissions}
        />
      );
    },
  },
];
