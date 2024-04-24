import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb";
  import { Button } from "@/components/ui/button";
  import { DataTable } from "@/components/data-table";
  import { columns } from "./columns";
  import { getDataSets } from "@/api/datasets";
  import { objToQuery } from "@/lib/client-utils";
  
  interface DatasetsProps {
    searchParams?: { [key: string]: string | undefined } | {};
  }

  export default async function DataSets({ searchParams }: DatasetsProps) {

    const result = await getDataSets();
  
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
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex justify-between mt-3">
          <h1 className="text-4xl font-semibold"> Active Datasets</h1>
          <div>
            <Button
              size="lg"
              className="mr-3 text-md bg-blue-900 hover:bg-blue-800"
            >
              Active Datasets
            </Button>
            <Button size="lg" className="text-md bg-blue-900 hover:bg-blue-800">
              Archived Datasets
            </Button>
          </div>
        </div>
        <div className="mb-10">
          <DataTable columns={columns} data={result} type= "dataset"/>
        </div>
      </div>
    );
  }
  