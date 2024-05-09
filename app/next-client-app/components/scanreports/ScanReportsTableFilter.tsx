"use client";

import { FacetsFilter } from "@/components/scanreports/FacetsFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [selectedOptions, setOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
    handleFacetsFilter(selectedOptions);
  }, [selectedOptions]);

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
    setOptions((prevValues) => {
      const isSelected = selectedOptions.some(
        (item) => item.value === option.value,
      );

      if (isSelected) {
        return prevValues.filter((item) => item.value !== option.value);
      } else {
        return [...prevValues, option];
      }
    });
  };

  const handleFacetsFilter = (options: FilterOption[]) => {
    navigateWithSearchParam(
      "status__in",
      options.map((option) => option.value),
      router,
      searchParam,
    );
  };

  // TODO: Move this out to a constants or something else please
  const statusMapping = [
    { label: "Blocked", value: "BLOCKED", color: "text-red-900" },
    { label: "Mapping Complete", value: "COMPLET", color: "text-green-600" },
    { label: "Mapping 25%", value: "INPRO25", color: "text-orange-300" },
    { label: "Mapping 50%", value: "INPRO50", color: "text-orange-400" },
    { label: "Mapping 75%", value: "INPRO75", color: "text-orange-500" },
    { label: "Upload Complete", value: "UPCOMPL", color: "text-blue-800" },
    { label: "Upload Failed", value: "UPFAILE", color: "text-red-500" },
    { label: "Upload in Progress", value: "UPINPRO", color: "text-orange-600" },
  ];

  return (
    <div className="flex">
      <Input
        placeholder={`Filter by ${filterText}...`}
        onChange={handleFilter}
        className="max-w-sm"
      />

      <FacetsFilter
        title="Status"
        options={statusMapping}
        filterFunction={handleFacetsFilter}
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
