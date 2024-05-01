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
  searchParams?: { [key: string]: string | undefined } | {};
}

export default async function DataSets({ searchParams }: DataSetListProps) {
  const query = objToQuery(searchParams ?? {});
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
          <TabsList className="grid w-25 grid-cols-2">
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
