import { getScanReport, getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { NavGroup } from "@/components/core/nav-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import DeleteDialog from "@/components/scanreports/DeleteDialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Edit,
  FileScan,
  GripVertical,
  TrashIcon,
} from "lucide-react";
import { Boundary } from "@/components/core/boundary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns/format";
import { ScanReportStatus } from "@/components/scanreports/ScanReportStatus";
import { notFound } from "next/navigation";

export default async function ScanReportLayout({
  params,
  children,
}: Readonly<{
  params: { id: string };
  children: React.ReactNode;
}>) {
  const permissions = await getScanReportPermissions(params.id);
  const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];
  const canEdit =
    permissions.permissions.includes("CanEdit") ||
    permissions.permissions.includes("CanAdmin");

  const items = [
    {
      name: "Tables",
      iconName: "TableProperties",
    },
    { name: "Rules", slug: "mapping_rules", iconName: "Waypoints" },
    { name: "Review Rules", slug: "review_rules", iconName: "SearchCheck" },
  ];

  const scanreport = await getScanReport(params.id);

  if (!scanreport) {
    return notFound();
  }

  if (
    !requiredPermissions.some((permission) =>
      permissions.permissions.includes(permission),
    )
  ) {
    return (
      <div className="pt-10 px-16">
        <Forbidden />
      </div>
    );
  }

  const createdDate = new Date(scanreport.created_at);
  return (
    <>
      <div className="pt-10 px-16 space-y-2">
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
        {/* Details line */}
        <div className="flex font-semibold text-3xl items-center">
          <FileScan className="mr-2 text-green-700" />
          <h2>{scanreport.dataset}</h2>
        </div>
        <div className="flex items-center text-sm space-x-3">
          <div className="flex items-center">
            <h3 className="text-gray-500">
              Dataset:{" "}
              <Link href={`/datasets/${scanreport.parent_dataset.id}/`}>
                <span className="text-black">
                  {scanreport.parent_dataset.name}
                </span>
              </Link>
            </h3>
          </div>
          <div>|</div>
          <div className="flex items-center">
            <h3 className="text-gray-500">
              Data Partner:{" "}
              <span className="text-black">{scanreport.data_partner}</span>
            </h3>
          </div>
          <div>|</div>
          <div className="flex items-center">
            <h3 className="text-gray-500">
              Created:{" "}
              <span className="text-black">
                {format(createdDate, "MMM dd, yyyy h:mm a")}
              </span>
            </h3>
          </div>
          <div>|</div>
          <div className="flex items-center">
            <div className="ml-2">
              <ScanReportStatus
                id={params.id}
                status={scanreport.status}
                dataset={scanreport.dataset}
                className="w-[180px] h-7"
                disabled={!canEdit} // Disable when users don't have permission
              />
            </div>
          </div>
        </div>
        {/* "Navs" group */}
        <div className="flex justify-between">
          <NavGroup
            path={`/scanreports/${params.id}`}
            items={[
              ...items.map((x) => ({
                text: x.name,
                slug: x.slug,
                iconName: x.iconName,
              })),
            ]}
          />
          {/* Actions button */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <GripVertical className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <a
                    href={`/scanreports/${params.id}/details`}
                    className="flex"
                  >
                    <Edit className="mr-2 size-4" />
                    Edit Scan Report Details
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a
                    href={`/api/scanreports/${params.id}/download/`}
                    download
                    className="flex"
                  >
                    <Download className="mr-2 size-4" />
                    Export Scan Report
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DeleteDialog id={Number(params.id)} redirect>
                    <Button
                      variant={"ghost"}
                      className="text-red-400 px-0 py-0 h-auto"
                    >
                      <TrashIcon className="mr-2 size-4" />
                      Delete Scan Report
                    </Button>
                  </DeleteDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Boundary>
          {" "}
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            {children}
          </Suspense>
        </Boundary>
      </div>
    </>
  );
}
