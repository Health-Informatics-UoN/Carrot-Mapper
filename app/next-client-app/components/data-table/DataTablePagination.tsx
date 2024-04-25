import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { navigateWithSearchParam } from "@/lib/client-utils";

interface DataTablePaginationProps<TData> {
  count: number;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  count,
  pageSizeOptions = [10, 20, 30, 40, 50],
}: DataTablePaginationProps<TData>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("p") ?? "1");
  const pageSize = Number(searchParams.get("page_size") ?? "10");
  const numberOfPages = Math.ceil(count / (pageSize ? pageSize : 10));
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  useEffect(() => {
    navigateWithSearchParam("page_size", currentPageSize, router, searchParams);
  }, [currentPageSize]);

  const navigateToPage = (param: number) => {
    navigateWithSearchParam("p", param, router, searchParams);
  };

  const canNotGoToPreviousPage = (): boolean => {
    return currentPage === 1 || count < pageSize;
  };

  const canNotGoToNextPage = (): boolean => currentPage >= numberOfPages;

  return (
    <div className="flex w-full flex-col-reverse items-center justify-end gap-4 overflow-auto p-1 sm:flex-row sm:gap-8">
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm mt-3 font-medium">Rows per page</p>
          <Select
            onValueChange={(value) => {
              setCurrentPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[4.5rem]">
              <SelectValue placeholder={currentPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {currentPage} of {numberOfPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            className="hidden size-8 p-0 lg:flex text-white bg-[#475da7]"
            onClick={() => navigateToPage(1)}
            disabled={canNotGoToPreviousPage()}
          >
            <DoubleArrowLeftIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className="size-8 text-white bg-[#475da7]"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={canNotGoToPreviousPage()}
          >
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className="size-8 text-white bg-[#475da7]"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={canNotGoToNextPage()}
          >
            <ChevronRightIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex text-white bg-[#475da7]"
            onClick={() => navigateToPage(numberOfPages)}
            disabled={canNotGoToNextPage()}
          >
            <DoubleArrowRightIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
