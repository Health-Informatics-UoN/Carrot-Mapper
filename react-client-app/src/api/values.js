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

const fetcher = async (...args) =>{
    const response = await fetch(...args);
    return await response.json();
}

/* Fetches all scan report values for a specific scan report field id */
function useScanReportValues(id) {
    const { data, error } = useSWR(`${api}/scanreportvaluesfilter/?scan_report_field=${id}`, fetcher)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}

/* Fetches all scan concepts for a specific scan report value id */
function useScanReportConcepts(id) {
    const { data, error } = useSWR(`${api}/scanreportconceptsfilter/?object_id=${id}`, fetcher)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}


/* Fetches concept object for specific concept id */
function useConcepts(id) {
    const { data, error } = useSWR(`${api}/omop/concepts/${id}`, fetcher)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}




const getScanReportValues = async (id) => {
    const response = await fetch(`${api}/scanreportvaluesfilter/?scan_report_field=${id}`);
    const data =  await response.json();
    return data;
}
const getScanReportConcepts = async (id) => {
    const response = await fetch(`${api}/scanreportconceptsfilter/?object_id=${id}`);
    return await response.json();
}
const getConcepts = async (id) => {
    const response = await fetch(`${api}/omop/concepts/${id}`);
    return await response.json();
}



async function getConceptLoop(valueId) {
    const output = []
    
    await getScanReportValues(valueId).then(values => {
        values.map((value) => {
            getScanReportConcepts(value.id).then(concepts => {
                concepts.map((concept) => {
                    getConcepts(concept.concept).then(con => {
                        output.push(con)
                    })
                })
            })
        })
    })
    return output
}

/* 
(1) Need to call useScanReportValues hook 
    Once complete update state?
(2) On ScanReportValue state change call useScanReportConcepts for each scan report value
    Once complete again update state
(3) */

export { useValue, useScanReportValues, useScanReportConcepts, useConcepts, getScanReportValues, getScanReportConcepts, getConcepts, getConceptLoop }