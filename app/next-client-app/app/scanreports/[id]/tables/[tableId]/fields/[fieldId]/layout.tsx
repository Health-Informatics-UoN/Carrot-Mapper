import {
  getScanReportField,
  getScanReportPermissions,
} from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";
import { Button } from "@/components/ui/button";
import { Boundary } from "@/components/ui/layout/boundary";
import { TabGroup } from "@/components/ui/layout/tab-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

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
      <div className="flex justify-between mb-3">
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

      <Boundary>
        {" "}
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          {children}
        </Suspense>
      </Boundary>
    </>
  );
}
