import { Input } from "@/components/ui/input";
import { navigateWithSearchParam } from "@/lib/client-utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function DataTableFilter({ filter }: { filter: string }) {
  const router = useRouter();
  const searchParam = useSearchParams();

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

  return (
    <Input
      placeholder={`Filter by ${filter}...`}
      onChange={handleFilter}
      className="max-w-sm"
    />
  );
}