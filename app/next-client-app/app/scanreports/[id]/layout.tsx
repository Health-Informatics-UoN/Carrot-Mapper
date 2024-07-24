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
import { ChevronDown, Download, TrashIcon } from "lucide-react";
import { Boundary } from "@/components/ui/layout/boundary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Scan Report Actions <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <a
                    href={`/api/scanreports/${params.id}/download/`}
                    download
                    className="flex"
                  >
                    Export Scan Report <Download className="ml-2 size-4" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DeleteDialog id={Number(params.id)} redirect>
                    <Button
                      variant={"ghost"}
                      className="text-red-400 px-0 py-0 h-auto"
                    >
                      Delete Scan Report <TrashIcon className="ml-2 size-4" />
                    </Button>
                  </DeleteDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Boundary>{children}</Boundary>
      </div>
    </>
  );
}
