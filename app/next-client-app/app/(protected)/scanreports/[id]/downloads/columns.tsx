"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const columns: ColumnDef<FileDownload>[] = [
  {
    id: "Created",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Created"
        sortName="created_at"
      />
    ),
    cell: ({ row }) => {
      const { created_at } = row.original;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <>{formatDistanceToNow(created_at)} ago</>
            </TooltipTrigger>
            <TooltipContent>
              {format(created_at, "MMM dd, yyyy h:mm a")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "User",
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Generated By"
        sortName="user"
      />
    ),
    cell: ({ row }) => {
      const { user } = row.original;
      return <>{user.username}</>;
    },
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Type",
    accessorKey: "file_type",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="File Type"
        sortName="file_type"
      />
    ),
    cell: ({ row }) => {
      const { file_type } = row.original;
      return <>{file_type.display_name}</>;
    },
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Download",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const { file_type } = row.original;
      return (
        <Button variant={"outline"}>
          Download <Download className="ml-2 size-4" />
        </Button>
      );
    },
    enableHiding: true,
    enableSorting: false,
  },
];
