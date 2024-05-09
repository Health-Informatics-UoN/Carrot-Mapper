"use client";

import { FacetsFilter } from "@/components/scanreports/FacetsFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusOptions } from "@/constants/scanReportStatus";
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

  useEffect(() => {
    handleFacetsFilter(selectedOptions);
  }, [selectedOptions]);

  useEffect(() => {
    const statusParam = searchParam.get("status__in");
    if (statusParam) {
      const statusValues = statusParam.split(",");
      const filteredOptions = statusOptions.filter((option) =>
        statusValues.includes(option.value),
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
          searchParam,
        );
      } else if (query.length === 0) {
        // Handle resetting the filter
        navigateWithSearchParam(
          `${filter}__icontains`,
          "",
          router,
          searchParam,
        );
      }
    },
    300,
  );

  const handleSelectOption = (option: FilterOption) => {
    setOptions((prevOptions) => {
      const isSelected = prevOptions?.some(
        (item) => item.value === option.value,
      );

      if (isSelected) {
        return prevOptions?.filter((item) => item.value !== option.value);
      } else {
        return [...(prevOptions || []), option];
      }
    });
  };

  const handleFacetsFilter = (options?: FilterOption[]) => {
    console.log("welp");
    navigateWithSearchParam(
      "status__in",
      options?.map((option) => option.value) || "",
      router,
      searchParam,
    );
  };

  return (
    <div className="flex">
      <Input
        placeholder={`Filter by ${filterText}...`}
        onChange={handleFilter}
        className="max-w-sm"
      />

      <FacetsFilter
        title="Status"
        options={statusOptions}
        selectedOptions={selectedOptions}
        handleSelect={handleSelectOption}
        handleClear={() => setOptions([])}
      />

      <Link href="/scanreports/create" prefetch={false}>
        <Button variant={"outline"} className="">
          New Scan Report
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
