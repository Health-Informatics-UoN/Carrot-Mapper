
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
const usePost = async (url,data) =>{
    const response = await fetch(url,
    {
        method: "POST",
        headers: {
            Authorization: "Token "+authToken,
        'Content-Type': 'application/json; charset=utf-8'},
        body: JSON.stringify(data)    
    }
    );
    const res = await response.json();
    return res;
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

const saveMappingRules = async (scan_report_concept,scan_report_value,table) => {
    const domain = scan_report_concept.concept.domain_id.toLowerCase()
    const fields = await useGet(`${api}/omopfields/`)
    const cachedOmopFunction = mapConceptToOmopField()
    const m_date_field_mapper = {
        'person': ['birth_datetime'],
        'condition_occurrence': ['condition_start_datetime','condition_end_datetime'],
        'measurement':['measurement_datetime'],
        'observation':['observation_datetime'],
        'drug_exposure':['drug_exposure_start_datetime','drug_exposure_end_datetime']
        }
    const destination_field = await cachedOmopFunction(fields,domain+"_source_concept_id")
    
    if(destination_field == undefined){
        throw 'Could not find a destination field for this concept'
    }
    const promises = []
    const data = 
    {
        scan_report:table.scan_report,
        concept: scan_report_concept.id, 
        approved:true,
    }
    //person_id
    data.omop_field = fields.filter(field=> field.field == "person_id" && field.table==destination_field.table)[0].id
    data.source_field = table.person_id
    promises.push(usePost(`${api}/structuralmappingrules/`,data))
    //date_event
    data.source_field = table.date_event
    const omopTable = await useGet(`${api}/omoptables/${destination_field.table}`)
    const date_omop_fields = m_date_field_mapper[omopTable.table]
    date_omop_fields.forEach(element => {
        data.omop_field = fields.filter(field=> field.field == element && field.table==destination_field.table)[0].id
        promises.push(usePost(`${api}/structuralmappingrules/`,data))
    })
    //_source_concept_id
    data.omop_field = destination_field.id
    data.source_field = scan_report_value.scan_report_field
    promises.push(usePost(`${api}/structuralmappingrules/`,data))
    //_concept_id
    let tempOmopField = await cachedOmopFunction(fields,domain+"_concept_id")
    data.omop_field = tempOmopField.id
    data.source_field = scan_report_value.scan_report_field
    promises.push(usePost(`${api}/structuralmappingrules/`,data))
    //_source_value
    tempOmopField = await cachedOmopFunction(fields,domain+"_source_value")
    data.omop_field = tempOmopField.id
    data.source_field = scan_report_value.scan_report_field
    promises.push(usePost(`${api}/structuralmappingrules/`,data))
    //measurement
    if(domain == 'measurement'){
        tempOmopField = await cachedOmopFunction(fields,"value_as_number","measurement")
        console.log(tempOmopField)
        data.omop_field = tempOmopField.id
        data.source_field = scan_report_value.scan_report_field
        promises.push(usePost(`${api}/structuralmappingrules/`,data))
        }  
        const values = await Promise.all(promises)
        return values
}
const mapConceptToOmopField = () =>{
    let omopTables = null
    const m_allowed_tables = ['person','measurement','condition_occurrence','observation','drug_exposure']
    return async (fields,domain,table) =>{
        if(!table){
            const mappedFields = fields.filter(field=> field.field == domain)
            if(mappedFields.length<2){
                return mappedFields[0]
            }
            // if there are more than 1
            // if omopTables hasn't previously been retrieved retreive it, otherwise, use cached version
            if(!omopTables){
                omopTables = await useGet(`${api}/omoptables/`)
            } 
            let mappedTables = mappedFields.map(field=> (
                {
                table:omopTables.find(t=>t.id == field.table),
                field:field
                }))
            mappedTables = mappedTables.map(val=>({...val,isAllowed:m_allowed_tables.includes(val.table.table)})) 
            return mappedTables.find(val=> val.isAllowed==true).field
        }
        if(!omopTables){
            omopTables = await useGet(`${api}/omoptables/`)
        } 
        // find omop tables where table == table
        let mappedTable = omopTables.find(t=>t.table == table)
        const mappedField = fields.find(f=> f.table == mappedTable.id && f.field==domain)
        return mappedField
    }
}



export { getScanReportValues,saveMappingRules,
    getScanReportField,getScanReportTable,
     getScanReportConcepts, getConcept,getScanReports,authToken,api,
     }