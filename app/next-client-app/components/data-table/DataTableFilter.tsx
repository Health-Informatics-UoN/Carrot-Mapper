import { Input } from "@/components/ui/input";
import { navigateWithSearchParam } from "@/lib/client-utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function DataTableFilter({
  filter,
}: {
  filter: { name: string; value: string };
}) {
  const router = useRouter();
  const searchParam = useSearchParams();

  const handleFilter = useDebouncedCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      if (query.length > 2) {
        navigateWithSearchParam(
          `${filter.value}__icontains`,
          query,
          router,
          searchParam,
        );
      } else if (query.length === 0) {
        // Handle resetting the filter
        navigateWithSearchParam(
          `${filter.value}__icontains`,
          "",
          router,
          searchParam,
        );
      }
    },
    300,
  );

  return (
    <Input
      placeholder={`Filter by ${filter.name}...`}
      onChange={handleFilter}
      className="max-w-sm"
    />
  );
}
