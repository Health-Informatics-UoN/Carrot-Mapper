import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { getScanReports } from "@/api/scan-reports";

export default async function ScanReports() {
  const result = await getScanReports();

  return (
    <div className="pt-10 px-16">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/scan-reports">Scan Reports</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex justify-between mt-3">
        <h1 className="text-4xl font-semibold">Scan Reports Active</h1>
        <div>
          <Button
            size="lg"
            className="mr-3 text-md bg-blue-900 hover:bg-blue-800"
          >
            Active Reports
          </Button>
          <Button size="lg" className="text-md bg-blue-900 hover:bg-blue-800">
            Archived Reports
          </Button>
        </div>
      </div>
      <Button size="lg" className="my-5 text-md bg-blue-900 hover:bg-blue-800">
        New Scan Report
      </Button>
    </div>
  );
}
