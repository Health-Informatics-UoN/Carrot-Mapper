"use client";

import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const AnalyseColumns: ColumnDef<AnalyseRuleData>[] = [
  {
    id: "Rule ID",
    accessorKey: "rule_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rule ID" />
    ),
    enableHiding: true,
    enableSorting: false,
  },
  {
    id: "Rule Name",
    accessorKey: "rule_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rule Name" />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { destination_table } = row.original;
      return destination_table.name;
    },
  },
  {
    id: "Destination Field",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Destination Field" />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { destination_field } = row.original;
      return destination_field.name;
    },
  },
  {
    id: "Source Table",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source Table" />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { source_table } = row.original;
      const path = usePathname();
      const id = path.match(/\/(\d+)\/+/) ?? [];

      return (
        <Link href={`/scanreports/${id[1]}/tables/${source_table.id}/`}>
          <Button variant="outline">{source_table.name}</Button>
        </Link>
      );
    },
  },
  {
    id: "Source Field",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source Field" />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { source_table, source_field } = row.original;
      const path = usePathname();
      const id = path.match(/\/(\d+)\/+/) ?? [];

      return (
        <Link
          href={`/scanreports/${id[1]}/tables/${source_table.id}/fields/${source_field.id}`}
        >
          <Button variant="outline">{source_field.name}</Button>
        </Link>
      );
    },
  },
  {
    id: "Term Map",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Term Map" />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { omop_term, term_mapping } = row.original;

      return term_mapping ? (
        <>
          {Object.keys(term_mapping).map((key, index) => (
            <div key={index}>
              <div className="flex">
                <p className="text-red-500">{key}</p>{" "}
                <ArrowRight size="16px" className="ml-2" />
              </div>
              <p className="text-green-700">
                {term_mapping[key]} {omop_term}
              </p>
            </div>
          ))}
        </>
      ) : (
        <></>
      );
    },
  },
  {
    id: "Creation Type",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Creation Type"
        description="How the Mapping Rule has been created"
        className="cursor-pointer"
      />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { creation_type } = row.original;

      switch (creation_type) {
        case "V":
          return "Vocabulary";
        case "M":
          return "Manual";
        case "R":
          return "Reused";
        default:
          return "";
      }
    },
  },
];