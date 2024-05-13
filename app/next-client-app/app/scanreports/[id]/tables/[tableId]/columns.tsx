"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Input } from "@/components/ui/input";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { validateConceptCode } from "@/api/scanreports";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/error";
import AddConcept from "./add-concept";

export const columns: ColumnDef<ScanReportResult>[] = [
  {
    id: "Name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Field" sortName="name" />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "description",
    accessorKey: "description_column",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
        sortName="description_column"
      />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "Data Type",
    accessorKey: "type_column",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Data Type"
        sortName="type_column"
      />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "Concepts",
    accessorKey: "concept_id",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Concepts"
        sortName="concept_id"
      />
    ),
    enableHiding: true,
    enableSorting: true,
  },
  {
    id: "Add Concept",
    header: "",
    cell: ({ row }) => {
      const { id, scan_report_table } = row.original as ScanReportField;
      return (
        <AddConcept tableId={scan_report_table.toString()} source_field={id} />
      );
    },
  },
  {
    id: "edit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Edit" />
    ),
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <Link href={`fields/${id}/update`}>
          <Button>Edit Field</Button>
        </Link>
      );
    },
  },
];
