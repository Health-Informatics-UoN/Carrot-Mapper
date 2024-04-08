import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<ScanReport>[] = [
  {
    accessorKey: "id",
    // header: ({ column }) => (
    // //   <DataTableColumnHeader column={column} title="RedCap ID" />
    // ),
    // enableHiding: false,
  },
];
