"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { format } from "date-fns/format";
import { Status } from "./StageStatus";
import { JobStage } from "@/constants/job";

export const columns: ColumnDef<Job>[] = [
  {
    id: "Stage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => {
      const { stage } = row.original;
      return (
        <div className="w-[450px]">
          {JobStage.find((option) => option.value == stage.value)?.display_name}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "Status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const { status } = row.original;
      return <Status status={status || { value: "QUEUED" }} />;
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "Triggered At",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Triggered At" />
    ),
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
  {
    id: "Last Updated",
    accessorKey: "updated_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    enableSorting: false,
    enableHiding: true,
    cell: ({ row }) => {
      const date = new Date(row.original.updated_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
  {
    id: "Details",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details" />
    ),
    cell: ({ row }) => {
      const { details } = row.original;
      return <div className="w-[250px]">{details}</div>;
    },
    enableSorting: false,
    enableHiding: true,
  },
];
