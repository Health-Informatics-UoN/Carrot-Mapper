import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getDataSet } from "@/api/datasets";
import { DatasetDetailsForm } from "@/components/datasets/DatasetDetailsForm";

interface DataSetListProps {
  params: {
    id: string;
  };
}

export default async function ScanReports({
  params: { id },
}: DataSetListProps) {
  const dataset = await getDataSet(id);

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
        <DatasetDetailsForm dataset={dataset} />
      </div>
    </div>
  );
}
