import { Forbidden } from "@/components/core/Forbidden";
import { NavGroup } from "@/components/core/nav-group";
import { BriefcaseBusiness } from "lucide-react";
import { Boundary } from "@/components/core/boundary";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns/format";
import { getDataSet, getDatasetPermissions } from "@/api/datasets";
import { Badge } from "@/components/ui/badge";
import { InfoItem } from "@/components/core/InfoItem";
import Link from "next/link";
import { getproject } from "@/api/projects";

export default async function DatasetLayout({
  params,
  children,
}: Readonly<{
  params: { id: string };
  children: React.ReactNode;
}>) {
  // const permissions = await getDatasetPermissions(params.id);
  // const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];

  const items = [
    {
      name: "Datasets",
      iconName: "Folders",
    },
    { name: "Edit Details", slug: "details", iconName: "Edit" },
  ];

  const project = await getproject(params.id);

  // const dataPartner = dataset.data_partner;

  const createdDate = new Date(project.created_at);
  const updatedDate = new Date(project.updated_at);
  // Checking permissions
  // if (
  //   !requiredPermissions.some((permission) =>
  //     permissions.permissions.includes(permission)
  //   )
  // ) {
  //   return <Forbidden />;
  // }
  return (
    <div className="space-y-2">
      <div className="flex font-semibold text-xl items-center space-x-2">
        <BriefcaseBusiness className="text-gray-500" />
        <Link href={`/projects`}>
          <h2 className="text-gray-500 dark:text-gray-400">Projects</h2>
        </Link>
        <h2 className="text-gray-500 dark:text-gray-400">{"/"}</h2>
        <BriefcaseBusiness className="text-orange-700" />
        <h2>{project.name}</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center text-sm space-y-2 md:space-y-0 divide-y md:divide-y-0 md:divide-x divide-gray-300">
        <InfoItem
          label="Members number"
          value={project.members.length.toString()}
          className="py-1 md:py-0 md:pr-3"
        />
        <InfoItem
          label="Created"
          value={format(createdDate, "MMM dd, yyyy h:mm a")}
          className="py-1 md:py-0 md:px-3"
        />
        <InfoItem
          label="Updated"
          value={format(updatedDate, "MMM dd, yyyy h:mm a")}
          className="py-1 md:py-0 md:px-3"
        />
      </div>
      {/* "Navs" group */}
      <div className="flex justify-between">
        <NavGroup
          path={`/projects/${params.id}`}
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
  );
}
