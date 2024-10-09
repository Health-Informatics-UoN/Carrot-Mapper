"use client";

import { FacetsFilter } from "@/components/scanreports/FacetsFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadStatusOptions } from "@/constants/scanReportStatus";
import { navigateWithSearchParam } from "@/lib/client-utils";
import { FilterOption } from "@/types/filter";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function ScanReportsTableFilter({
  filter,
  filterText,
}: {
  filter: string;
  filterText: string;
}) {
  const router = useRouter();
  const searchParam = useSearchParams();

  const [selectedOptions, setOptions] = useState<FilterOption[]>();

  // Runs on load to populate the selectedOptions from params
  useEffect(() => {
    const statusParam = searchParam.get("status__in");
    if (statusParam) {
      const statusValues = statusParam.split(",");
      const filteredOptions = UploadStatusOptions.filter((option) =>
        statusValues.includes(option.value)
      );
      setOptions(filteredOptions);
    }
  }, []);

  const handleFilter = useDebouncedCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      if (query.length > 2) {
        navigateWithSearchParam(
          `${filter}__icontains`,
          query,
          router,
          searchParam
        );
      } else if (query.length === 0) {
        // Handle resetting the filter
        navigateWithSearchParam(
          `${filter}__icontains`,
          "",
          router,
          searchParam
        );
      }
    },
    300
  );

  const handleSelectOption = (option: FilterOption) => {
    const updatedOptions = selectedOptions ? [...selectedOptions] : [];
    const isSelected = updatedOptions.some(
      (item) => item.value === option.value
    );

    if (isSelected) {
      // Remove if it's already selected
      const index = updatedOptions.findIndex(
        (item) => item.value === option.value
      );
      updatedOptions.splice(index, 1);
    } else {
      updatedOptions.push(option);
    }

    setOptions(updatedOptions);
    handleFacetsFilter(updatedOptions);
  };

  const handleFacetsFilter = (options?: FilterOption[]) => {
    navigateWithSearchParam(
      "status__in",
      options?.map((option) => option.value) || "",
      router,
      searchParam
    );
  };

  return (
    <div className="flex w-full">
      <Input
        placeholder={`Filter by ${filterText}...`}
        onChange={handleFilter}
        className="max-w-xs mr-4"
      />

      <div className="max-sm:hidden">
        <FacetsFilter
          title="Status"
          options={UploadStatusOptions}
          selectedOptions={selectedOptions}
          handleSelect={handleSelectOption}
          handleClear={() => (setOptions([]), handleFacetsFilter())}
        />
      </div>
      <div className="flex-grow"></div>

      <Link href="/scanreports/create" prefetch={false}>
        <Button variant={"outline"} className="ml-auto mr-4">
          New Scan Report
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
