import { Input } from "@/components/ui/input";
import { navigateWithSearchParam } from "@/lib/client-utils";
import { useRouter, useSearchParams } from "next/navigation";

export function DataTableFilter({ filter }: { filter: string }) {
  const router = useRouter();
  const searchParam = useSearchParams();

  return (
    <Input
      placeholder={`Filter by ${filter}...`}
      onChange={(event) => {
        const param = event.currentTarget.value;
        navigateWithSearchParam(
          `${filter}__icontains`,
          param,
          router,
          searchParam,
        );
      }}
      className="max-w-sm"
    />
  );
}
