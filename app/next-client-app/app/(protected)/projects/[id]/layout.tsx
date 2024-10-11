import { Forbidden } from "@/components/core/Forbidden";
import { NavGroup } from "@/components/core/nav-group";
import { Folders } from "lucide-react";
import { Boundary } from "@/components/core/boundary";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns/format";
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
  const items = [
    {
      name: "Datasets",
      iconName: "Database",
    },
    { name: "Details", slug: "details", iconName: "BookText" },
  ];

  const project = await getproject(params.id);
  const createdDate = new Date(project.created_at);

  // If user is not a member of the project, the API result will be failed and empty ==> forbidden
  if (project.id === 0) {
    return <Forbidden />;
  }
  return (
    <div className="space-y-2">
      <div className="flex font-semibold text-xl items-center space-x-2">
        <Folders className="text-gray-500" />
        <Link href={`/projects`}>
          <h2 className="text-gray-500 dark:text-gray-400">Projects</h2>
        </Link>
        <h2 className="text-gray-500 dark:text-gray-400">{"/"}</h2>
        <Folders className="text-orange-700" />
        <h2>{project.name}</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center text-sm space-y-2 md:space-y-0 divide-y md:divide-y-0 md:divide-x divide-gray-300">
        <InfoItem
          label="Number of Members"
          value={project.members.length.toString()}
          className="py-1 md:py-0 md:pr-3"
        />
        <InfoItem
          label="Created"
          value={format(createdDate, "MMM dd, yyyy h:mm a")}
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
