"use client";

import { DataTable } from "@/components/data-table";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { useEffect, useState } from "react";

interface CustomDataTableProps<T> {
  scanReportsData: T[];
  permissions: PermissionsResponse;
  count: number;
  columns: (setDeath: (death: boolean, id: number) => void) => any;
  filterCol: string;
  filterText: string;
  linkPrefix?: string;
}

export function DataTableUpdate<
  T extends {
    id: number;
    concepts?: Concept[];
    permissions: Permission[];
    death_table: boolean;
  }
>({
  scanReportsData,
  permissions,
  count,
  columns,
  filterCol,
  filterText,
  linkPrefix,
}: CustomDataTableProps<T>) {
  const filter = <DataTableFilter filter={filterCol} filterText={filterText} />;
  const [data, setData] = useState(scanReportsData);

  const setDeath = (death: boolean, id: number) => {
    console.log("setDeath called with:", death, "for id:", id);
    const updatedData = data.map((table) => {
      if (table.id === id) {
        return { ...table, death };
      }
      return table;
    });
    setData(updatedData);
  };
  const scanReportsResult = data.map((table) => {
    table.permissions = permissions.permissions;
    return table;
  });
  console.log(scanReportsResult);
  return (
    <div>
      <DataTable
        columns={columns(setDeath)}
        data={scanReportsResult}
        count={count}
        Filter={filter}
        linkPrefix={linkPrefix}
      />
    </div>
  );
}
