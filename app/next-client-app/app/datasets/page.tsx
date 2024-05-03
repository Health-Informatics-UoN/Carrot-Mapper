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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { objToQuery } from "@/lib/client-utils";
import Link from "next/link";

interface DataSetListProps {
  searchParams?: {
    hidden?: boolean;
    page_size: number;
  };
}

export default async function DataSets({ searchParams }: DataSetListProps) {
  const defaults = {
    hidden: false,
    page_size: 10,
  };

  const customSearchParams = { ...defaults, ...searchParams };

  const query = objToQuery(customSearchParams);
  const dataset = await getDataSets(query);

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
        <h1 className="text-4xl font-semibold">Dataset List</h1>
        <Link href="/">
          <Button size="lg" className="text-md">
            New Dataset
          </Button>
        </Link>
      </div>
      <div className="my-5">
        <Tabs
          defaultValue={
            (searchParams as any)?.hidden
              ? (searchParams as any)?.hidden === "true"
                ? "archived"
                : "active"
              : "active"
          }
        >
          <TabsList className="w-1/2 h-1/2 sm:w-1/4 flex flex-col sm:flex-row">
            <a href="?hidden=false" className="h-full w-full">
              <TabsTrigger value="active">Active Datasets</TabsTrigger>
            </a>
            <a href="?hidden=true" className="h-full w-full">
              <TabsTrigger value="archived">Archived Datasets</TabsTrigger>
            </a>
          </TabsList>
          <TabsContent value="active">
            <DataTable
              columns={columns}
              data={dataset.results}
              count={dataset.count}
              filter="name"
            />
          </TabsContent>
          <TabsContent value="archived">
            <DataTable
              columns={columns}
              data={dataset.results}
              count={dataset.count}
              filter="name"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
