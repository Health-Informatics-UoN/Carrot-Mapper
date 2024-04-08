import { apiUrl as apiUrl } from "@/constants";
import { ApiError } from "./error";

interface RequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  download?: boolean;
  cache?: RequestCache;
  next?: { revalidate: number };
}

const request = async <T>(url: string, options: RequestOptions = {}) => {
  const response = await fetch(`${apiUrl}/api/${url}`, {
    method: options.method || "GET",
    body: options.body,
    cache: options.cache,
    next: options.next,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new ApiError(errorMessage, response.status);
  }

  if (options.download) {
    return response.blob() as unknown as T;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

export default request;
