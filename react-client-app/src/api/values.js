import useSWR from "swr"

//const mockApi = "https://my.api.mockaroo.com"

const mockApi = "https://609e52b633eed8001795841d.mockapi.io/"
/* Fetch all values from the API using SWR */
function useValue() {
    //const { data, error } = useSWR(`${mockApi}/values_co_connect.json?key=b65ef470`);

    const { data, error, revalidate } = useSWR(`${mockApi}/values`);
    return {
        data: data,
        isLoading: !error && !data,
        isError: error,
        revalidate: revalidate
    }
}


const api = 'http://127.0.0.1:8080/api'

/* Fetches all scan report values for a specific scan report field id */
function useScanReportValues({ id }) {
    const { data, error, revalidate } = useSWR(`${api}/scanreportvaluesfilter/?scan_report_field=${id}`)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error,
        revalidate: revalidate
    }
}

/* Fetches all scan concepts for a specific scan report value id */
function useScanReportConcepts() {
    const { data, error, revalidate } = useSWR(`${api}/scanreportconceptsfilter/?object_id=841984`)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error,
        revalidate: revalidate
    }
}

/* Fetches concept object for specific concept id */
function useConcepts({ id }) {
    const { data, error, revalidate } = useSWR(`${api}/omop/concepts/${id}`)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error,
        revalidate: revalidate
    }
}


export { useValue, useScanReportValues, useScanReportConcepts, useConcepts }