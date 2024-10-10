import { getScanReports } from "@/api/scanreports";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { objToQuery } from "@/lib/client-utils";
import { ScanReportsTableFilter } from "@/components/scanreports/ScanReportsTableFilter";
import { FilterParameters } from "@/types/filter";
import { getproject } from "@/api/projects";
import { columns } from "./columns";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";

interface ProjectDetailProps {
  params: {
    id: string;
  };
  searchParams?: { status__in: string } & FilterParameters;
}

export default async function ProjectDetail({
  params: { id },
  searchParams,
}: ProjectDetailProps) {
  // const defaultParams = {
  //   hidden: false,
  //   page_size: 10,
  //   parent_dataset: id,
  // };
  // const combinedParams = { ...defaultParams, ...searchParams };

  // const query = objToQuery(combinedParams);
  // const scanReports = await getScanReports(query);
  const project = await getproject(id);
  const datasets = project.datasets;
  const filter = <DataTableFilter filter="name" />;

  return (
    <div>
      <DataTable
        columns={columns}
        data={datasets}
        count={datasets.length}
        Filter={filter}
      />
    </div>
  );
}
