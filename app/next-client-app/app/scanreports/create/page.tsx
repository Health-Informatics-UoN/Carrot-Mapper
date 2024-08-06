import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getDataPartners, getProjects } from "@/api/datasets";
import { CreateScanReportForm } from "@/components/scanreports/CreateScanReportForm";

export default async function ScanReports() {
  const partners = await getDataPartners();
  const projects = await getProjects();

  return (
    <div className="pt-5 px-16">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/scanreports">Scan Reports</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/scanreports/create/`}>
                Create
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex justify-between mt-3">
        <h1 className="text-4xl font-semibold">New Scan Report</h1>
      </div>
      <div className="mt-4">
        <CreateScanReportForm dataPartners={partners} projects={projects} />
      </div>
    </div>
  );
}
