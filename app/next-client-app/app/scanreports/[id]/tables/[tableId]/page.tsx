import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  params: {
    tableId: string;
  };
};

export default async function ScanReportsTable({ params: { tableId } }: Props) {
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
              <BreadcrumbLink href="/scanreports">Scan Reports</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>{tableId}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mt-3">
        <h1 className="text-4xl font-semibold">Fields</h1>
      </div>
      <div className="flex justify-between mt-3 flex-col sm:flex-row">
        <div className="flex gap-2">
          <Link href="/">
            <Button size="lg" className="text-md">
              Scan Report Details
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" className="text-md">
              Rules
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button size="lg" className="text-md">
              Download Scan Report File
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" className="text-md">
              Download Scan Report Dictionary
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
