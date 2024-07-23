import {
  getScanReportField,
  getScanReportPermissions,
} from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { Button } from "@/components/ui/button";
import { TabGroup } from "@/components/ui/layout/tab-group";

export default async function ScanReportFieldsLayout({
  params,
  children,
}: Readonly<{
  params: { id: string; tableId: string; fieldId: string };
  children: React.ReactNode;
}>) {
  const fieldName = await getScanReportField(params.fieldId);
  const permissions = await getScanReportPermissions(params.id);
  const requiredPermissions: Permission[] = ["CanAdmin", "CanEdit", "CanView"];

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
        <div className="flex justify-between mt-2">
          <TabGroup
            path={`/scanreports/${params.id}/tables/${params.tableId}/fields/${params.fieldId}`}
            items={[
              {
                text: "Scan Report Values",
              },
            ]}
          />
          <Button variant={"secondary"}>Field name: {fieldName.name}</Button>
        </div>

        <div>{children}</div>
      </div>
    </>
  );
}
