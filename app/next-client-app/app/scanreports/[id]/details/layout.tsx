import { getScanReportPermissions } from "@/api/scanreports";
import { Forbidden } from "@/components/core/Forbidden";

export default async function ScanReportDetailsLayout({
  params,
  children,
}: Readonly<{
  params: { id: string };
  children: React.ReactNode;
}>) {
  const permissions = await getScanReportPermissions(params.id);
  const canEdit =
    permissions.permissions.includes("CanEdit") ||
    permissions.permissions.includes("CanAdmin");

  if (!canEdit) {
    return (
      <div>
        <Forbidden />
      </div>
    );
  }
  return <>{children}</>;
}
