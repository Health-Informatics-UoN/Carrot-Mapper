"use client";

import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns/format";

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" sortName="name" />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "Creation Date",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Creation Date"
        sortName="created_at"
      />
    ),
    enableHiding: true,
    enableSorting: true,
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return format(date, "MMM dd, yyyy h:mm a");
    },
  },
];
