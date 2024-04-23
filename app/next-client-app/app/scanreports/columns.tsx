"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDownIcon,
  ArchiveIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const columns: ColumnDef<ScanReportResult>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "dataset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dataset" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "data_partner",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data Partner" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Uploaded" />
    ),
    enableHiding: false,
    enableSorting: true,
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      const options: any = {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      const formattedDate = date.toLocaleDateString("en-US", options);
      return formattedDate;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    enableHiding: false,
    cell: ({ row }) => {
      return "TBD";
    },
  },
  {
    accessorKey: "rules",
    header: "",
    enableHiding: false,
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <Link href={`/scanreports/${id}/mapping_rules`}>
          <Button className="bg-[#475da7]">Rules</Button>
        </Link>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-[#475da7]">
              Actions <ChevronDownIcon className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Archive <ArchiveIcon className="ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Edit <Pencil2Icon className="ml-auto" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
