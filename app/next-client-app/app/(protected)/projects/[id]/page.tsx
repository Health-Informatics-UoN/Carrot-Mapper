import { DataTable } from "@/components/data-table";
import { objToQuery } from "@/lib/client-utils";
import { FilterParameters } from "@/types/filter";
import { columns } from "./columns";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { getDataSets } from "@/api/datasets";

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
  const defaultParams = {
    hidden: false,
    page_size: 10,
    project: id,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const datasets = await getDataSets(query);
  const filter = <DataTableFilter filter="name" />;

  return (
    <div>
      <DataTable
        columns={columns}
        data={datasets.results}
        count={datasets.count}
        Filter={filter}
      />
    </div>
  );
}
