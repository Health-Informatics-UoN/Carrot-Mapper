
const authToken = window.a
const api = window.u+'api'
const m_allowed_tables = ['person','measurement','condition_occurrence','observation','drug_exposure']

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
// function for post requests to api with authorization token
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
const useDelete = async (url) => {
    const response = await fetch(`${api}/${url}`,
        {
            method: "DELETE",
            headers: { Authorization: "Token " + authToken },
        }
    );
    return response;
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
                const newArr = values.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 :0))
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

// function to save mapping rules copying python implementation
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
    // if a destination field can't be found for concept domain, return error
    if(destination_field == undefined){
        throw 'Could not find a destination field for this concept'
    }
    // create a list to populate with requests for each structural mapping rule to be created
    const promises = []
    // data object to be passed to post request to create mapping rule
    const data = 
    {
        scan_report:table.scan_report,
        concept: scan_report_concept.id, 
        approved:true,
    }
    // create mapping rule for the following
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
    // set source field depending on content type
    if(scan_report_concept.content_type==15){
        data.source_field = scan_report_concept.object_id 
    }
    else{
        data.source_field = scan_report_value.scan_report_field
    }
    //_source_concept_id
    data.omop_field = destination_field.id
    promises.push(usePost(`${api}/structuralmappingrules/`,data))
    //_concept_id
    let tempOmopField = await cachedOmopFunction(fields,domain+"_concept_id")
    data.omop_field = tempOmopField.id
    promises.push(usePost(`${api}/structuralmappingrules/`,data))
    //_source_value
    tempOmopField = await cachedOmopFunction(fields,domain+"_source_value")
    data.omop_field = tempOmopField.id
    promises.push(usePost(`${api}/structuralmappingrules/`,data))
    //measurement
    if(domain == 'measurement'){
        tempOmopField = await cachedOmopFunction(fields,"value_as_number","measurement")
        console.log(tempOmopField)
        data.omop_field = tempOmopField.id
        promises.push(usePost(`${api}/structuralmappingrules/`,data))
    }  
    // when all requests have finished, return
        const values = await Promise.all(promises)
        return values
}
//function to map concept domain to an omop field
const mapConceptToOmopField = () =>{
    // cached values
    let omopTables = null
    
    // mapping function which is returned by this function
    return async (fields,domain,table) =>{
        //if omop table is not specified
        if(!table){
            // get omop fields that match specified domain
            const mappedFields = fields.filter(field=> field.field == domain)
            if(mappedFields.length<2){
                return mappedFields[0]
            }
            // if there are more than 1 fields that match the domain
            // if omopTables hasn't previously been retrieved retreive it, otherwise, use cached version
            if(!omopTables){
                omopTables = await useGet(`${api}/omoptables/`)
            } 
            // find correct field to return
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
        // find omop field with specified table and domain
        let mappedTable = omopTables.find(t=>t.table == table)
        const mappedField = fields.find(f=> f.table == mappedTable.id && f.field==domain)
        return mappedField
    }
}

// function to turn list of ids into a set of sublists of id's who's total length does not exceed a limit
const chunkIds = (list) => {
    const chunkedList = [[]]

    let maxChars = 2000
    let currentChars = 80
    list.map(async (value, index) => {
        const digits = value.toString().length
        if (currentChars + digits > maxChars - 20) {
            currentChars = 80 + digits
            chunkedList.push([])
            chunkedList[chunkedList.length - 1].push(value)
        }
        else {
            currentChars = currentChars + digits
            chunkedList[chunkedList.length - 1].push(value)
        }
    })
    if(chunkedList[0].length == 0){
        return []
    }
    return chunkedList
}

const getMappingRules = async (id, tableData, switchFilter) => {
    // get and sort all mapping rules for a particular scan report
    let mappingRules = await useGet(`${api}/structuralmappingrulesfilter/?scan_report=${id}`)
    const scanReport = await useGet(`${api}/scanreports/${id}`)
    const datapartner = await useGet(`${api}/datapartners/${scanReport.data_partner}`)
    scanReport.data_partner = datapartner
    if(mappingRules.length==0){
        tableData.current = mappingRules
        switchFilter(3)
        return scanReport
    }
    mappingRules = mappingRules.sort((a, b) => (a.concept > b.concept) ? 1 : ((b.concept > a.concept) ? -1 : 0))
    // get all unique source fields, omop fields, and scan report concepts that need to be queried
    const sourceFields = {}
    const omopFields = {}
    const scanReportConcepts = {}
    mappingRules.map(value => {
        if (value.source_field) {
            if (sourceFields[value.source_field]) {
                sourceFields[value.source_field].push(value.id)
            }
            else {
                sourceFields[value.source_field] = [value.id]
            }
        }

        if (value.omop_field) {
            if (omopFields[value.omop_field]) {
                omopFields[value.omop_field].push(value.id)
            }
            else {
                omopFields[value.omop_field] = [value.id]
            }
        }

        if (value.concept) {
            if (scanReportConcepts[value.concept]) {
                scanReportConcepts[value.concept].push(value.id)
            }
            else {
                scanReportConcepts[value.concept] = [value.id]
            }

        }
    })
    // make batch queries for omop fields, scan report concepts, and scan report fields
    const omopFieldKeys = chunkIds(Object.keys(omopFields))
    const omopFieldPromises = []
    for (let i = 0; i < omopFieldKeys.length; i++) {
        omopFieldPromises.push(useGet(`${api}/omopfieldsfilter/?id__in=${omopFieldKeys[i].join()}`))
    }
    const scanReportConceptKeys = chunkIds(Object.keys(scanReportConcepts))
    const scanReportConceptPromises = []
    for (let i = 0; i < scanReportConceptKeys.length; i++) {
        scanReportConceptPromises.push(useGet(`${api}/scanreportconceptsfilter/?id__in=${scanReportConceptKeys[i].join()}`))
    }

    const sourceFieldKeys = chunkIds(Object.keys(sourceFields))
    const sourceFieldPromises = []
    for (let i = 0; i < sourceFieldKeys.length; i++) {
        sourceFieldPromises.push(useGet(`${api}/scanreportfieldsfilter/?id__in=${sourceFieldKeys[i].join()}`))
    }
    const initialPromises = await Promise.all([Promise.all(omopFieldPromises), Promise.all(scanReportConceptPromises), Promise.all(sourceFieldPromises)])
    const omopFieldsLibrary = [].concat.apply([], initialPromises[0])
    const scanReportConceptsLibrary = [].concat.apply([], initialPromises[1])
    const sourceFieldLibrary = [].concat.apply([], initialPromises[2])

    omopFieldsLibrary.forEach(element => {
        mappingRules = mappingRules.map(rule => rule.omop_field == element.id ? { ...rule, omop_field: element } : rule)
    })
    scanReportConceptsLibrary.forEach(element => {
        mappingRules = mappingRules.map(rule => rule.concept == element.id ? { ...rule, scanreportconcept: element } : rule)
    })
    sourceFieldLibrary.forEach(element => {
        mappingRules = mappingRules.map(rule => rule.source_field == element.id ? { ...rule, source_field: element } : rule)
    })

    // get all unique omop tables, scan report values, scan report tables, and omop concept ids to be queried
    const omopTablesObject = {}
    const scanReportValuesObject = {}
    const scanReportFieldsObject = {}
    const scanReportTablesObject = {}
    const omopConceptsObject = {}


    scanReportConceptsLibrary.map(value => {
        if (value.content_type == 17) {
            if (value.object_id) {
                if (scanReportValuesObject[value.object_id]) {
                    scanReportValuesObject[value.object_id].push(value.id)
                }
                else {
                    scanReportValuesObject[value.object_id] = [value.id]
                }
            }
        }
        else {
            if (value.object_id) {
                if (scanReportFieldsObject[value.object_id]) {
                    scanReportFieldsObject[value.object_id].push(value.id)
                }
                else {
                    scanReportFieldsObject[value.object_id] = [value.id]
                }
            }
        }

        if (value.concept) {
            if (omopConceptsObject[value.concept]) {
                omopConceptsObject[value.concept].push(value.id)
            }
            else {
                omopConceptsObject[value.concept] = [value.id]
            }
        }
    })
    sourceFieldLibrary.map(value => {
        if (value.scan_report_table) {
            if (scanReportTablesObject[value.scan_report_table]) {
                scanReportTablesObject[value.scan_report_table].push(value.id)
            }
            else {
                scanReportTablesObject[value.scan_report_table] = [value.id]
            }
        }
    })
    omopFieldsLibrary.map(value => {
        if (value.table) {
            if (omopTablesObject[value.table]) {
                omopTablesObject[value.table].push(value.id)
            }
            else {
                omopTablesObject[value.table] = [value.id]
            }
        }
    })
    const omopTableKeys = chunkIds(Object.keys(omopTablesObject))
    const scanReportValueKeys = chunkIds(Object.keys(scanReportValuesObject))
    const scanReportFieldKeys = chunkIds(Object.keys(scanReportFieldsObject))
    const scanReportTableKeys = chunkIds(Object.keys(scanReportTablesObject))
    const omopConceptKeys = chunkIds(Object.keys(omopConceptsObject))

    // batch query unique ids for these tables
    const omopTablePromises = []
    const scanReportValuePromises = []
    const scanReportFieldPromises = []
    const scanReportTablePromises = []
    const omopConceptPromises = []

    for (let i = 0; i < omopTableKeys.length; i++) {
        omopTablePromises.push(useGet(`${api}/omoptablesfilter/?id__in=${omopTableKeys[i].join()}`))
    }
    for (let i = 0; i < scanReportValueKeys.length; i++) {
        scanReportValuePromises.push(useGet(`${api}/scanreportvaluesfilter/?id__in=${scanReportValueKeys[i].join()}`))
    }
    for (let i = 0; i < scanReportTableKeys.length; i++) {
        scanReportTablePromises.push(useGet(`${api}/scanreporttablesfilter/?id__in=${scanReportTableKeys[i].join()}`))
    }
    for (let i = 0; i < omopConceptKeys.length; i++) {
        omopConceptPromises.push(useGet(`${api}/omop/conceptsfilter/?concept_id__in=${omopConceptKeys[i].join()}`))
    }
    for (let i = 0; i < scanReportFieldKeys.length; i++) {
        scanReportFieldPromises.push(useGet(`${api}/scanreportfieldsfilter/?id__in=${scanReportFieldKeys[i].join()}`))
    }


    const secondaryPromises = await Promise.all([Promise.all(omopTablePromises), Promise.all(scanReportValuePromises), Promise.all(scanReportTablePromises), Promise.all(omopConceptPromises), Promise.all(scanReportFieldPromises)])

    const omopTablesLibrary = [].concat.apply([], secondaryPromises[0])
    const scanReportValueLibrary = [].concat.apply([], secondaryPromises[1])
    const scanReportTableLibrary = [].concat.apply([], secondaryPromises[2])
    const omopConceptLibrary = [].concat.apply([], secondaryPromises[3])
    const scanReportFieldLibrary = [].concat.apply([], secondaryPromises[4])

    omopTablesLibrary.forEach(element => {
        mappingRules = mappingRules.map(rule =>
            rule.omop_field.table == element.id ? { ...rule, omop_field: { ...rule.omop_field, table: element } } : rule)
    })
    omopConceptLibrary.forEach(element => {
        mappingRules = mappingRules.map(rule =>
            rule.scanreportconcept.concept == element.concept_id ? { ...rule, scanreportconcept: { ...rule.scanreportconcept, concept: element } } : rule)
    })
    scanReportTableLibrary.forEach(element => {
        mappingRules = mappingRules.map(rule =>
            rule.source_field.scan_report_table == element.id ? { ...rule, source_field: { ...rule.source_field, scan_report_table: element } } : rule)
    })

    for (let i = 0; i < scanReportConceptsLibrary.length; i++) {
        if (scanReportConceptsLibrary[i].content_type == 17) {
            const element = scanReportValueLibrary.find(val => val.id == scanReportConceptsLibrary[i].object_id)
            if (element != undefined) {
                element.scan_report_concept = scanReportConceptsLibrary[i]
                mappingRules = mappingRules.map(rule => rule.concept == element.scan_report_concept.id ? { ...rule, scanreport: element } : rule)
            }
            
        }
        else {
            const element = scanReportFieldLibrary.find(val => val.id == scanReportConceptsLibrary[i].object_id)
            if (element != undefined) {
                element.scan_report_concept = scanReportConceptsLibrary[i]
                mappingRules = mappingRules.map(rule => rule.concept == element.scan_report_concept.id ? { ...rule, scanreport: element } : rule)
            }
        }


    }

    tableData.current = mappingRules
    
    switchFilter(3)
    return scanReport
}

const getScanReportFieldValues = async (valueId, valuesRef) => {
    let response = await useGet(`${api}/scanreportfieldsfilter/?scan_report_table=${valueId}`)
    response = response.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 :0))
    if (response.length == 0) {
        return []
    }
    const ids = chunkIds(response.map(value => value.id))
    const promises = []
    // send API request for every sublist
    for (let i = 0; i < ids.length; i++) {
        promises.push(useGet(`${api}/scanreportconceptsfilter/?object_id__in=${ids[i].join()}`))
    }
    const promiseResults = await Promise.all(promises)
    let scanreportconcepts = [].concat.apply([], promiseResults)

    if (scanreportconcepts.length == 0) {
        response = response.map(element => ({ ...element, conceptsLoaded: true, concepts: [] }))
        valuesRef.current = response
        return response
    }
    const conceptIds = chunkIds(scanreportconcepts.map(value => value.concept))

    const conceptPromises = []
    // send API request for every sublist
    for (let i = 0; i < conceptIds.length; i++) {
        conceptPromises.push(useGet(`${api}/omop/conceptsfilter/?concept_id__in=${conceptIds[i].join()}`))
    }

    const conceptPromiseResults = await Promise.all(conceptPromises)

    const omopConcepts = [].concat.apply([], conceptPromiseResults)

    scanreportconcepts = scanreportconcepts.map(element => ({ ...element, concept: omopConcepts.find(con => con.concept_id == element.concept) }))
    // map each scanreport concept to it's value
    response = response.map(element => ({ ...element, conceptsLoaded: true, concepts: scanreportconcepts.filter(concept => concept.object_id == element.id) }))
    valuesRef.current = response
    console.log(response)
    return response
}



export { getScanReportValues,saveMappingRules,useGet,usePost,useDelete,getScanReportFieldValues,
    getScanReportField,getScanReportTable,getMappingRules,mapConceptToOmopField,m_allowed_tables,
     getScanReportConcepts, getConcept,getScanReports,authToken,api,
     }