import request from "@/lib/api/request";

/**
 * Fetches all pages of paginated data from the specified url.
 *
 * Iterates through paginated data until all pages are fetched and concatenated.
 *
 * @template T - The type of data to be fetched
 * @param {string} url - The url to fetch from
 * @returns {Promise<T[]>} - A promise that resolves to an array of all fetched data
 */
export async function fetchAllPages<T>(url: string): Promise<T[]> {
  let allResults: T[] = [];
  let pageNumber = 1;

  while (true) {
    const urlWithPage = `${url}&p=${pageNumber}`;
    const data: PaginatedResponse<T> = await request(urlWithPage);

    allResults = allResults.concat(data.results);
    pageNumber++;
    if (!data.next) break;
  }

  return allResults;
}
