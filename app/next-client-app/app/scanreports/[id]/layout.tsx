import { getScanReport, getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { TabGroup } from "@/components/ui/layout/tab-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import DeleteDialog from "@/components/scanreports/DeleteDialog";
import { Button } from "@/components/ui/button";
import { Download, TrashIcon } from "lucide-react";

export default async function ScanReportLayout({
  params,
  children,
}: Readonly<{
  params: { id: string };
  children: React.ReactNode;
}>) {
  const permissions = await getScanReportPermissions(params.id);
  const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];
  const categories = [
    { name: "Scan Report Details", slug: "details" },
    { name: "Mapping Rules", slug: "mapping_rules" },
  ];

  const scanreport = await getScanReport(params.id);
  if (
    !requiredPermissions.some((permission) =>
      permissions.permissions.includes(permission)
    )
  ) {
    return (
      <div className="pt-10 px-16">
        <Forbidden />
      </div>
    );
  }
  return (
    <>
      <div className="pt-10 px-16 space-y-3">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href="/scanreports">
                  Scan Reports
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/scanreports/${params.id}/`}>
                  {scanreport.dataset}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex justify-between">
          <TabGroup
            path={`/scanreports/${params.id}`}
            items={[
              {
                text: "Scan Report Tables",
              },
              ...categories.map((x) => ({
                text: x.name,
                slug: x.slug,
              })),
            ]}
          />
          <div className="flex gap-2">
            <Button variant={"outline"}>
              <a href={`/api/scanreports/${params.id}/download/`} download>
                Export Scan Report
              </a>
              <Download className="ml-2 size-4" />
            </Button>
            <DeleteDialog id={Number(params.id)} redirect>
              <Button variant={"outline"} className="text-red-400">
                Delete Scan Report
                <TrashIcon className="ml-2 size-4" />
              </Button>
            </DeleteDialog>
          </div>
        </div>
        <div>{children}</div>
      </div>
    </>
  );
}
