import useSWR from "../../_snowpack/pkg/swr.js"
import axios from '../../_snowpack/pkg/axios.js'

//const mockApi = "https://my.api.mockaroo.com"

const mockApi = "https://609e52b633eed8001795841d.mockapi.io/"
const authToken = "e43f31b7272ef87ff9627efbb40ae6153abc98ef"
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

const fetcher = async (url,token) =>{
    const response = await  axios
    .get(url, { headers: { Authorization: "Token " + token } });
    return await response.data;
}

/* Fetches all scan report values for a specific scan report field id */
function useScanReportValues(id) {
    const { data, error } = useSWR([`${api}/scanreportvaluesfilter/?scan_report_field=${id}`,authToken  ], fetcher)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}

/* Fetches all scan concepts for a specific scan report value id */
function useScanReportConcepts(id) {
    const { data, error } = useSWR([`${api}/scanreportconceptsfilter/?object_id=${id}`, authToken ], fetcher)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}


/* Fetches concept object for specific concept id */
function useConcepts(id) {
    const { data, error } = useSWR([`${api}/omop/concepts/${id}`, authToken], fetcher)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}




const getScanReportValues = async (id) => {
    const response = await fetch(`${api}/scanreportvaluesfilter/?scan_report_field=${id}`,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},    
    }
    );
    const data = response.json();
    return data;
}
const getScanReportConcepts = async (id) => {
    const response = await fetch(`${api}/scanreportconceptsfilter/?object_id=${id}`,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},    
    });
    return response.json();
}
const getConcepts = async (id) => {
    const response = await fetch(`${api}/omop/concepts/${id}`,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},    
    });
    return response.json();
}


/* const getScanReportValues = async (id) => {
    const { data, error } = useSWR([`${api}/scanreportvaluesfilter/?scan_report_field=${id}`, authToken], fetcher)
    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
    const response = await fetch();
    
} */



//async function getConceptLoop(valueId) {
const getConceptLoop = async (valueId) =>{
    
    const response = await getScanReportValues(valueId).then((values) => {
        
        if(values.length>0){
            return values.map(async (value) => {
                return await getScanReportConcepts(value.id).then(concepts => {
                    if(concepts.length>0){           
                        return concepts.map(async (concept) => {
                            return await getConcepts(concept.concept).then(con => { 
                                //console.log(con)
                                //output.push(con)
                                return con  
                            })
                        })
                    }
                })
            })
        } 
        else{
            return [undefined]
        }  
        
    })
    
    
    return response
    
}

/* 
(1) Need to call useScanReportValues hook 
    Once complete update state?
(2) On ScanReportValue state change call useScanReportConcepts for each scan report value
    Once complete again update state
(3) */

export { useValue, useScanReportValues, useScanReportConcepts, useConcepts, getScanReportValues, getScanReportConcepts, getConcepts, getConceptLoop }