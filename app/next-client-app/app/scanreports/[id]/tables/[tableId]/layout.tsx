import { getScanReport, getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { TabGroup } from "@/components/ui/layout/tab-group";

export default async function ScanReportFieldsLayout({
  params,
  children,
}: Readonly<{
  params: { id: string; tableId: string };
  children: React.ReactNode;
}>) {
  const permissions = await getScanReportPermissions(params.id);
  const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];
  const categories = [
    {
      name: "Scan Report Table Details",
      slug: "update",
      count: 11,
      parent: null,
    },
  ];

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
      <div>
        <div className="flex justify-between">
          <TabGroup
            path={`/scanreports/${params.id}/tables/${params.tableId}`}
            items={[
              {
                text: "Scan Report Fields",
              },
              ...categories.map((x) => ({
                text: x.name,
                slug: x.slug,
              })),
            ]}
          />
        </div>
        <div>{children}</div>
      </div>
    </>
  );
}
