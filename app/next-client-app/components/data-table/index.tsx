"use client";

import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "./DataTablePagination";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  count: number;
  linkPrefix?: string;
  Filter?: JSX.Element;
}

function UrlBuilder(id: string, prefix: string = "") {
  return `${prefix}${id}/`;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  count,
  linkPrefix = "",
  Filter,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualFiltering: true,
    manualSorting: true,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  const handleRowClick = (id: string) => {
    const location = window.location.pathname;
    window.location.href = UrlBuilder(
      id,
      `${location.endsWith("/") ? location : location + "/"}${linkPrefix}`
    );
  };

  return (
    <div>
      <div className="flex justify-between my-4">
        {Filter}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Toggle columns"
              variant="outline"
              className="ml-auto hidden lg:flex"
            >
              <MixerHorizontalIcon className="mr-2 size-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div></div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:cursor-pointer"
                  // TODO: Once we are only routing to Nextjs urls, we can do this better.
                  // Do not change this unless every table is only ever redirecting to Next urls.
                  onClick={() => handleRowClick((row.original as any).id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            typeof cell.getValue() === "string" ||
                            typeof cell.getValue() === "number"
                          ) {
                            handleRowClick((row.original as any).id);
                          }
                        }}
                        className="inline-block"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center space-x-2 py-4">
        <DataTablePagination count={count} />
      </div>
    </div>
  );
}
