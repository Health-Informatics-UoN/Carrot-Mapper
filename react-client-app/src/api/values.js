
const authToken = window.a
const api = window.u+'api'

// get scan report for specific id
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
    getScanReportValues(valueId)
    .then((values) => {
        if (!Array.isArray(values)){
            setError(true)
            return
        }
        if(values.length>0){
            const newArr = values.sort((a,b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 :0))
            scanReportsRef.current = newArr.map(scanReport => ({...scanReport, concepts:[],conceptsToLoad:1}))
            setScanReports(scanReportsRef.current)
            // chunking ids to smaller lists of ids if needed
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
            for(let i=0;i<idsToGet.length;i++){
                promises.push(getAllconcepts(idsToGet[i].join()))
            }
            Promise.all(promises).then((values) => {
                let concepts = [].concat.apply([], values)
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
                                        {...scanReport,conceptsToLoad:valuesToFill[scanReport.id].length} : {...scanReport,conceptsToLoad:0})
                if(concepts.length==0){
                    setScanReports(scanReportsRef.current)
                }
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
                // set all concepts to error state
                scanReportsRef.current = scanReportsRef.current.map(scanReport =>({...scanReport,conceptsToLoad:-1}))
                setScanReports(scanReportsRef.current)
                
            })
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
     getScanReportConcepts, getConcept,getScanReports,authToken,api,
     }