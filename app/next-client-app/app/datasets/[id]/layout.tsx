import { Forbidden } from "@/components/core/Forbidden";
import { NavGroup } from "@/components/core/nav-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Folders } from "lucide-react";
import { Boundary } from "@/components/core/boundary";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns/format";
import {
  getDataPartners,
  getDataSet,
  getDatasetPermissions,
  getProjects,
} from "@/api/datasets";
import { Badge } from "@/components/ui/badge";

export default async function DatasetLayout({
  params,
  children,
}: Readonly<{
  params: { id: string };
  children: React.ReactNode;
}>) {
  const permissions = await getDatasetPermissions(params.id);
  const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];

  const items = [
    {
      name: "Scan Reports",
      iconName: "FileScan",
    },
    { name: "Edit Details", slug: "details", iconName: "Edit" },
  ];

  const dataset = await getDataSet(params.id);
  // Get the list of data partners then filter it
  const dataPartnersList = await getDataPartners();
  const dataPartner = dataPartnersList.filter(
    (partner) => partner.id === dataset.data_partner
  );
  // Get the list of projects then filter it
  const projectsList = await getProjects();
  const projects = projectsList.filter((project) =>
    dataset.projects.includes(project.id)
  );

  const createdDate = new Date(dataset.created_at);
  // Checking permissions
  if (
    !requiredPermissions.some((permission) =>
      permissions.permissions.includes(permission)
    )
  ) {
    return (
      <div className="pt-5 px-16">
        <Forbidden />
      </div>
    );
  }
  return (
    <>
      <div className="pt-5 px-16 space-y-2">
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
                <BreadcrumbLink href={`/datasets/${params.id}/`}>
                  {dataset.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {/* Details line */}
        <div className="flex font-semibold text-3xl items-center my-2">
          <Folders className="mr-2 text-blue-700" />
          <h2>{dataset.name}</h2>
        </div>
        <div className="flex items-center text-sm space-x-3">
          <div>
            <h3 className="text-gray-500 flex items-center gap-2">
              <div>Project(s): </div>
              <div className="flex space-x-1">
                {projects.map((project) => (
                  <Badge
                    variant={"outline"}
                    className="bg-carrot-100 dark:bg-carrot-700"
                    key={project.id}
                  >
                    {project.name}
                  </Badge>
                ))}
              </div>
            </h3>
          </div>
          <div>|</div>
          <div className="flex items-center">
            <h3 className="text-gray-500">
              Data Partner:{" "}
              <span className="text-black dark:text-white/90">
                {dataPartner[0].name}
              </span>
            </h3>
          </div>
          <div>|</div>
          <div className="flex items-center">
            <h3 className="text-gray-500">
              Created:{" "}
              <span className="text-black dark:text-white/90">
                {format(createdDate, "MMM dd, yyyy h:mm a")}
              </span>
            </h3>
          </div>
        </div>
        {/* "Navs" group */}
        <div className="flex justify-between">
          <NavGroup
            path={`/datasets/${params.id}`}
            items={[
              ...items.map((x) => ({
                text: x.name,
                slug: x.slug,
                iconName: x.iconName,
              })),
            ]}
          />
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
