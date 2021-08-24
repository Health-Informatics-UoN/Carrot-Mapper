
const authToken = window.a
const api = window.u+'api'

// function to fetch from api with authorization token
const useGet = async (url) =>{
    const response = await fetch(url,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},    
    }
    );
    const data = await response.json();
    return data;
}
// get scan report field with given id
const getScanReportField = async (id)=>{
    const field = await useGet(`${api}/scanreportfields/${id}`)
    return field
}
// get scan report table with given id
const getScanReportTable = async (id)=>{
    const table = await useGet(`${api}/scanreporttables/${id}`)
    return table
}
// get scan report values for specific id
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
// get concepts for a specific scan report
const getScanReportConcepts = async (id) => {
    const response = await fetch(`${api}/scanreportconceptsfilter/?object_id=${id}`,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},    
        importance: "low" 
    });
    return response.json();
}
// get a concept by id
// pass identifier to use as id to delete the concept from the scan report
const getConcept = async (id,identifier) => { 
    const response = await fetch(`${api}/omop/concepts/${id}`,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},
        importance: "high"  
    }).then(res=>{
        return res.json().then(function(json) {
            json.id = identifier;
            return json;
          });
    })
    return response
}

// get all concepts for specific scan report before returning
const getAllconcepts = async (ids) => {   
    const response = await fetch(`${api}/scanreportconceptsfilter/?object_id__in=${ids}`,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},    
        importance: "low" 
    });
    const concepts = await response.json()
    console.log(concepts)
    return concepts;
}

const getScanReports = async (valueId,setScanReports,scanReportsRef,setLoadingMessage,setError) =>{
    // get all the values in the table
    getScanReportValues(valueId)
        .then((values) => {
            // Once the api has returned, check if an error was returned or not
            if (!Array.isArray(values)){
                setError(true)
                return
            }
            // If there are values in the table, check for concepts, otherwise, return no values
            if(values.length>0){
                // set all values to indicate that it is loading concepts
                const newArr = values.sort((a,b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 :0))
                scanReportsRef.current = newArr.map(scanReport => ({...scanReport, concepts:[],conceptsToLoad:1}))
                setScanReports(scanReportsRef.current)
                // Create list of sublists of value ids to pass to the endpoint so that api requests don't exceed character limits
                // could just be 1 sublist if the list is short enough
                const idsToGet = [[]]
                let maxChars = 2000
                let currentChars = 80
                scanReportsRef.current.map(async (value,index) => {
                        const digits = value.id.toString().length
                        if(currentChars+digits> maxChars-20){
                            currentChars = 80+digits
                            idsToGet.push([])
                            idsToGet[idsToGet.length-1].push(value.id)
                        } 
                        else{
                            currentChars = currentChars+digits
                            idsToGet[idsToGet.length-1].push(value.id)
                        }                              
                        
                })
                //
                const promises = []
                // send API request for every sublist
                for(let i=0;i<idsToGet.length;i++){
                    promises.push(getAllconcepts(idsToGet[i].join()))
                }
                //Do once all api requests from the sublists have returned
                Promise.all(promises).then((values) => {
                    // create an array of all the results from the sublists api requests
                    let concepts = [].concat.apply([], values)
                    // create a list of concepts to get and a list of values that contain concepts
                    const conceptsToget = {}
                    const valuesToFill = {}
                    concepts.map(concept=> {    
                        if(conceptsToget[concept.concept]){
                            conceptsToget[concept.concept].push({object_id:concept.object_id,identifier:concept.id})
                        }
                        else{
                            conceptsToget[concept.concept] = [{object_id:concept.object_id,identifier:concept.id}] 
                        }
            
                        if(valuesToFill[concept.object_id]){
                            valuesToFill[concept.object_id].push(concept.concept)
                        }
                        else{
                            valuesToFill[concept.object_id] = [concept.concept] 
                        }
                    })
                    // Set all values that have no concepts to loaded state
                    scanReportsRef.current = scanReportsRef.current.map((scanReport)=>valuesToFill[scanReport.id]?
                                            {...scanReport,conceptsToLoad:valuesToFill[scanReport.id].length} : {...scanReport,conceptsToLoad:0})
                    if(concepts.length==0){
                        setScanReports(scanReportsRef.current)
                    }

                    // for every unique concept, do api request to get the concept information and set
                    // that concept object to every value that it is assigned to 
                    for (const [key, valuesToMap] of Object.entries(conceptsToget)) {
                        getConcept(key).then(concept=>{    
                            valuesToMap.map(value =>{  
                                const tempConcept = concept
                                tempConcept.id = value.identifier
                                tempConcept.object_id = value.object_id
                                
                                scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==tempConcept.object_id?{...scanReport,concepts:[...scanReport.concepts,tempConcept],
                                    conceptsToLoad:scanReport.conceptsToLoad-1}:scanReport)
                            })
                            setScanReports(scanReportsRef.current)
                        })
                    }
                    
                })
                .catch(error =>{
                    // if an error is returned from the sublists api calls
                    // set all concepts to error state
                    scanReportsRef.current = scanReportsRef.current.map(scanReport =>({...scanReport,conceptsToLoad:-1}))
                    setScanReports(scanReportsRef.current)
                    
                })
            } 
            else{
                // return if there are no scan reports
                scanReportsRef.current = [undefined]
                setScanReports([undefined])
            }  
            
        })
        .catch(error =>{
            // if an error is returned from api call to get table values, set page state to error
            setError(true)
        })
}


const getScanReportsWaitToLoad = (valueId,setScanReports,scanReportsRef,setLoadingMessage,setError) =>{  
    getScanReportValues(valueId)
    .then((values) => {
        if (!Array.isArray(values)){
            setError(true)
            return
        }
        if(values.length>0){  
            const newArr = values.sort((a,b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 :0))
            scanReportsRef.current = newArr.map(scanReport => scanReport.conceptID==-1?{...scanReport, concepts:[],conceptsToLoad:0}:{...scanReport, concepts:[],conceptsToLoad:1})
            const idsToGet = []
            scanReportsRef.current.map(async (value,index) => {                           
                if(value.conceptID!=-1){
                    idsToGet.push(value.id)
                }
            })
            if(idsToGet.length>0){
                getAllconcepts(idsToGet.join()).then(concepts =>{
                    if(concepts.length == 0){
                        setScanReports(scanReportsRef.current)
                        return
                    }
                    const conceptsToget = {}
                    const valuesToFill = {}
                    concepts.map(concept=> {
                        
                        if(conceptsToget[concept.concept]){
                            conceptsToget[concept.concept].push({object_id:concept.object_id,identifier:concept.id})
                        }
                        else{
                            conceptsToget[concept.concept] = [{object_id:concept.object_id,identifier:concept.id}] 
                        }
            
                        if(valuesToFill[concept.object_id]){
                            valuesToFill[concept.object_id].push(concept.concept)
                        }
                        else{
                            valuesToFill[concept.object_id] = [concept.concept] 
                        }
                    })

                    scanReportsRef.current = scanReportsRef.current.map((scanReport)=>valuesToFill[scanReport.id]?
                                            {...scanReport,conceptsToLoad:valuesToFill[scanReport.id].length} : scanReport)
                    let thingsToLoad =  Object.keys(conceptsToget).length

                    for (const [key, valuesToMap] of Object.entries(conceptsToget)) {
                        getConcept(key).then(concept=>{    
                            thingsToLoad--
                            setLoadingMessage(thingsToLoad+" concepts to load")
                            valuesToMap.map(value =>{  
                                const tempConcept = concept
                                tempConcept.id = value.identifier
                                tempConcept.object_id = value.object_id    
                                scanReportsRef.current = scanReportsRef.current.map((scanReport)=>scanReport.id==tempConcept.object_id?{...scanReport,concepts:[...scanReport.concepts,tempConcept],
                                    conceptsToLoad:scanReport.conceptsToLoad-1}:scanReport)
                            })
                            if(thingsToLoad==0){
                                setScanReports(scanReportsRef.current)
                            }
                        })
                    }

                })
                .catch(error =>{
                    // set all concepts to error state
                    scanReportsRef.current = scanReportsRef.current.map(scanReport => scanReport.conceptID==-1?
                        scanReport:{...scanReport,conceptsToLoad:-1})
                        setScanReports(scanReportsRef.current)
                    
                })
            }
            else{
                setScanReports(scanReportsRef.current)
            }
        } 
        else{
            // this is what returns if there are no scan reports
            scanReportsRef.current = [undefined]
            setScanReports([undefined])
        }  
        
    })
    .catch(error =>{
        setError(true)
    })
}


export { getScanReportValues, getScanReportsWaitToLoad,
    getScanReportField,getScanReportTable,
     getScanReportConcepts, getConcept,getScanReports,authToken,api,
     }