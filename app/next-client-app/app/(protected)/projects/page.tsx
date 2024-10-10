import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { objToQuery } from "@/lib/client-utils";
import { DataTableFilter } from "@/components/data-table/DataTableFilter";
import { FilterParameters } from "@/types/filter";
import { BriefcaseBusiness } from "lucide-react";
import { getProjectsList } from "@/api/projects";

interface ProjectListProps {
  searchParams?: FilterParameters;
}

export default async function Projects({ searchParams }: ProjectListProps) {
  const defaultParams = {
    page_size: 10,
  };
  const combinedParams = { ...defaultParams, ...searchParams };
  const query = objToQuery(combinedParams);
  const projects = await getProjectsList(query);

  const filter = <DataTableFilter filter="name" />;

  return (
    <div className="space-y-2">
      <div className="flex font-semibold text-xl items-center">
        <BriefcaseBusiness className="mr-2 text-orange-700" />
        <h2>Projects</h2>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={projects.results}
          count={projects.count}
          Filter={filter}
        />
      </div>
    </div>
  );
}
