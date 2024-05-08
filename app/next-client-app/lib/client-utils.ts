import { ReadonlyURLSearchParams } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function navigateWithSearchParam(
  paramName: string,
  param: string | number,
  router: AppRouterInstance,
  searchParams: ReadonlyURLSearchParams
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

/**
 * Converts an object into a query string.
 *
 * Iterates over the object properties, encoding and combining with '&' to form a query string.
 *
 * @param obj - The object to be converted into a query string.
 * @returns A string representing the query.
 */
export function objToQuery(obj: { [key: string]: any }): string {
  if (Object.keys(obj).length === 0) return "";
  let query = "";
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key as keyof typeof obj];
      if (value !== undefined) {
        if (query.length > 0) {
          query += "&";
        }
        query += `${key}=${encodeURIComponent(value)}`;
      }
    }
  }
  return query;
}
