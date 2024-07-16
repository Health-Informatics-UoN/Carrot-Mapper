"use client";

import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

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
  },
  {
    id: "Ancestors/Descendants",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Ancestors (A)/Descendants (D)"
      />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { anc_desc } = row.original;
      const ancestors = anc_desc.flatMap((ancestor) =>
        ancestor.ancestors
          .sort((a, b) => b.a_id - a.a_id) // To make sure the anc_desc matching with the min/max separation
          .map((a) => <div key={a.a_id}>{`${a.a_id} - ${a.a_name} (A)`}</div>)
      );
      const descendants = anc_desc.flatMap((descendant) =>
        descendant.descendants
          .sort((a, b) => b.d_id - a.d_id) // To make sure the anc_desc matching with the min/max separation
          .map((d) => <div key={d.d_id}>{`${d.d_id} - ${d.d_name} (D)`}</div>)
      );
      return (
        <div className="flex flex-col">
          <div className="text-carrot">{ancestors}</div>
          <div className="text-carrot-reuse">{descendants}</div>
        </div>
      );
    },
  },
  {
    id: "Min/Max Separation - Source Field",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Min/Max Separation - Source Field"
      />
    ),
    enableHiding: true,
    enableSorting: false,
    cell: ({ row }) => {
      const { anc_desc } = row.original;
      const a_level_and_links = anc_desc.flatMap((ancestor) =>
        ancestor.ancestors
          .sort((a, b) => b.a_id - a.a_id) // To make sure the anc_desc matching with the min/max separation
          .map((a) => (
            <div
              key={a.a_id}
              className="text-carrot flex gap-3 items-center justify-items-start"
            >
              <div className="w-[70px]">{`${a.level.join("")}`}</div>
              {a.source.map((source) => (
                <div key={source.source_field__id}>
                  <Link
                    href={`/scanreports/${source.source_field__scan_report_table__scan_report}/tables/${source.source_field__scan_report_table__id}/fields/${source.source_field__id}/`}
                  >
                    {source.source_field__name}
                  </Link>
                </div>
              ))}
            </div>
          ))
      );
      const d_level_and_links = anc_desc.flatMap((descendant) =>
        descendant.descendants
          .sort((a, b) => b.d_id - a.d_id) // To make sure the anc_desc matching with the min/max separation
          .map((d) => (
            <div
              key={d.d_id}
              className="text-carrot-reuse flex gap-3 items-center"
            >
              <div className="w-[70px]">{`${d.level.join("")}`}</div>
              {d.source.map((source) => (
                <div key={source.source_field__id}>
                  <Link
                    href={`/scanreports/${source.source_field__scan_report_table__scan_report}/tables/${source.source_field__scan_report_table__id}/fields/${source.source_field__id}/`}
                  >
                    {source.source_field__name}
                  </Link>
                </div>
              ))}
            </div>
          ))
      );
      return (
        <div className="flex flex-col">
          <div>{a_level_and_links}</div>
          <div>{d_level_and_links}</div>
        </div>
      );
    },
  },
  // {
  //   id: "Source",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Source Field" />
  //   ),
  //   enableHiding: true,
  //   enableSorting: false,
  //   cell: ({ row }) => {
  //     const { anc_desc } = row.original;

  //     return (
  //       <div className="flex flex-col">
  //         <div>{a_source_buttons}</div>
  //         <div>{d_source_buttons}</div>
  //       </div>
  //     );
  //   },
  // },
];
