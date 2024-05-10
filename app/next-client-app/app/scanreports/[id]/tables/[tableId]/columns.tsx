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
      const validationSchema = Yup.object().shape({
        concept: Yup.number()
          .required("Field is required")
          .min(1, "Add a valid number"),
      });

      const handleSubmit = async (conceptCode: number) => {
        try {
          const concept = await validateConceptCode(conceptCode);
          if (concept.concept_id !== 0) {
          }
          toast.error("No concept matches this concept code!");
        } catch (error) {
          const errorObj = JSON.parse((error as ApiError).message);
          toast.error(`Adding concept failed! Error: ${errorObj.detail}`);
          console.error(error);
        }
      };

      return (
        <Formik
          initialValues={{ concept: "" }}
          validationSchema={validationSchema}
          onSubmit={(data, actions) => {
            handleSubmit(Number(data.concept));
            actions.resetForm();
          }}
        >
          {({ values, handleChange, handleSubmit, errors, touched }) => (
            <Form onSubmit={handleSubmit}>
              <div className="flex gap-2 w-3/4">
                <div className="flex-none">
                  <Input
                    type="number"
                    name="concept"
                    value={values.concept}
                    onChange={handleChange}
                  />
                  {errors.concept && touched.concept ? (
                    <p style={{ color: "red" }}>{errors.concept}</p>
                  ) : null}
                </div>{" "}
                <Button type="submit">Add</Button>
              </div>
            </Form>
          )}
        </Formik>
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
