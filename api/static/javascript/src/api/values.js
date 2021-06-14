import useSWR from "../../_snowpack/pkg/swr.js"

//const mockApi = "https://my.api.mockaroo.com"

const mockApi = "https://609e52b633eed8001795841d.mockapi.io/"
/* Fetch all values from the API using SWR */
export function useValue() {
    //const { data, error } = useSWR(`${mockApi}/values_co_connect.json?key=b65ef470`);

    const { data, error, revalidate } = useSWR(`${mockApi}/values`);
    return {
        data: data,
        isLoading: !error && !data,
        isError: error,
        revalidate: revalidate
    }
}