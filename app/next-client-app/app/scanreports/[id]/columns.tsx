"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

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
    enableHiding: true,
    enableSorting: true,
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
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "edit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const { id, scan_report, permissions } = row.original;
      return permissions.includes("CanEdit") ||
        permissions.includes("CanAdmin") ? (
        <Link href={`/scanreports/${scan_report}/tables/${id}/update`}>
          <Button variant={"secondary"}>
            Edit
            <Pencil className="ml-2 size-4" />
          </Button>
        </Link>
      ) : (
        <Button variant={"secondary"} disabled>
          Edit
          <Pencil className="ml-2 size-4" />
        </Button>
      );
    },
  },
];
