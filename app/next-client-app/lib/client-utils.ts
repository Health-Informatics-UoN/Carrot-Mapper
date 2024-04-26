import { ReadonlyURLSearchParams } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function navigateWithSearchParam(
  paramName: string,
  param: string | number,
  router: AppRouterInstance,
  searchParams: ReadonlyURLSearchParams,
) {
  const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
  if (param) {
    currentParams.set(paramName, param.toString());
  } else {
    currentParams.delete(paramName);
  }
  const queryString = currentParams.toString();
  router.push(`?${queryString}`, { scroll: false });
}

// Build query string for filtering and sorting
export function objToQuery(obj: { [key: string]: string }): string {
  if (Object.keys(obj).length === 0) return "";
  let query = "";
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (query.length > 0) {
        query += "&";
      }
      query += `${key}=${encodeURIComponent(obj[key])}`;
    }
  }
  return query;
}
