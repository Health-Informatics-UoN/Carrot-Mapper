import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getDataPartners,
  getDataSet,
  getDataUsers,
  getDatasetPermissions,
  getProjects,
} from "@/api/datasets";
import { DatasetFormikForm } from "@/components/datasets/DatasetFormikForm";

interface DataSetListProps {
  params: {
    id: string;
  };
}

export default async function DatasetDetails({
  params: { id },
}: DataSetListProps) {
  const dataset = await getDataSet(id);
  const partners = await getDataPartners();
  const users = await getDataUsers();
  const projects = await getProjects();
  const permissions = await getDatasetPermissions(id);

  return (
    <div className="pt-10 px-16">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/datasets">Datasets</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/datasets/${id}/`}>
                {dataset.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/datasets/${id}/details`}>
                Details
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex justify-between mt-3">
        <h1 className="text-4xl font-semibold">Details Page - Dataset #{id}</h1>
      </div>
      <div className="mt-4">
        <DatasetFormikForm
          dataset={dataset}
          dataPartners={partners}
          users={users}
          projects={projects}
          permissions={permissions.permissions}
        />
      </div>
    </div>
  );
}
