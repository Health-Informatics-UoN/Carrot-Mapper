import {
  getScanReport,
  getScanReportPermissions,
  getScanReportTable,
} from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { Button } from "@/components/ui/button";
import { TabGroup } from "@/components/ui/layout/tab-group";

export default async function ScanReportFieldsLayout({
  params,
  children,
}: Readonly<{
  params: { id: string; tableId: string };
  children: React.ReactNode;
}>) {
  const permissions = await getScanReportPermissions(params.id);
  const tableName = await getScanReportTable(params.tableId);
  const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];
  const categories = [
    {
      name: "Scan Report Table Details",
      slug: "update",
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
          <Button variant={"secondary"}>Table name: {tableName.name}</Button>
        </div>
        <div>{children}</div>
      </div>
    </>
  );
}
