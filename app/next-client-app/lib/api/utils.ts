import request from "@/lib/api/request";

/**
 * Fetches all pages of paginated data from the specified initial URL.
 *
 * Iterates through paginated data until all pages are fetched and concatenated.
 *
 * @template T - The type of data to be fetched
 * @param {string} initialUrl - The initial URL to start fetching paginated data from
 * @returns {Promise<T[]>} - A promise that resolves to an array of all fetched data
 */
export async function fetchAllPages<T>(initialUrl: string): Promise<T[]> {
  let url: string | null = initialUrl;
  let allResults: T[] = [];

  while (url) {
    const data: PaginatedResponse<T> = await request(url);

    allResults = allResults.concat(data.results);
    url = data.next;
  }

  return allResults;
}
