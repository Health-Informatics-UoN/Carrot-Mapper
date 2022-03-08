import Cookies from 'js-cookie';

const m_allowed_tables = ['person','measurement','condition_occurrence','observation','drug_exposure','procedure_occurrence','specimen']

// function to fetch from api with authorization token
const useGet = async (url) =>{
    const response = await fetch(`/api${url}`, 
    {
        method: "GET",
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-CSRFToken': Cookies.get('csrftoken'),
        }
    }
    );
    const data = await response.json();
    return data;
}
// function for post requests to api with authorization token
const usePost = async (url,data,withApi=true) =>{
    const response = await axios.post(withApi?`/api${url}`:url,
    data,
    {    
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-CSRFToken': Cookies.get('csrftoken'),
        },  
    }
    );
    if (response.status < 200 || response.status > 300) {
        console.log(response)
        throw response
    }
    const res = withApi? await response.data:response;
    return res;
}
const postForm = async (url,data) =>{
    const response = await fetch(url,
    {
        method: "POST",
        headers: {
            'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: data
    }
    );
    
    if (response.status < 200 || response.status > 300) {
        const json = await response.json()
        throw json
    }
    return response;
}
// function for patch requests to api with authorization token
const usePatch = async (url, body) => {
    const response = await fetch(`/api${url}`,
        {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-CSRFToken': Cookies.get('csrftoken'),
            },
            body: JSON.stringify(body)
        }
    );
    const res = await response.json();
    return res;
}
// function for delete requests to api with authorization token
const useDelete = async (url) => {
    const response = await fetch(`/api${url}`, {
        method: "DELETE", 
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-CSRFToken': Cookies.get('csrftoken'),
    }
});
    return response;
}
// get scan report field with given id
const getScanReportField = async (id)=>{
    const field = await useGet(`/scanreportfields/${id}/`)
    return field
}
// get scan report table with given id
const getScanReportTable = async (id)=>{
    const table = await useGet(`/scanreporttables/${id}/`)
    return table
}
// get concepts for a specific scan report
const getScanReportConcepts = async (id) => {
    const response = await useGet(`/scanreportconceptsfilter/?object_id=${id}`)
    return response;
}
// get scan report concepts for all specified values
const getValuesScanReportConcepts = async (values,contentType,scanReportsRef={},setScanReports=()=>{}) => {
    // create array of ids and use them to batch query for scanreport concepts associated to those id's
    const valueIds = chunkIds(values.map(value => value.id))
    const valuePromises = []
    for (let i = 0; i < valueIds.length; i++) {
        valuePromises.push(useGet(`/scanreportconceptsfilter/?object_id__in=${valueIds[i].join()}`))
    }
    const promiseResult = await Promise.all(valuePromises)
    let scanreportconcepts = [].concat.apply([], promiseResult)
    // only keep the scanreport concepts that are of the correct content type
    scanreportconcepts = scanreportconcepts.filter(concept=>concept.content_type==contentType)
    // if there are no scanreport concepts to map, return
    if (scanreportconcepts.length == 0) {
        values = values.map(element => ({ ...element, conceptsLoaded: true, concepts: [] }))
        scanReportsRef.current = values
        return values
    }
    // create a list of unique omop concept id's and use them to make a batch call to the api
    const conceptIdsObject = {}
        scanreportconcepts.map(value => {
            if (value.concept) {
                if (conceptIdsObject[value.concept]) {
                    conceptIdsObject[value.concept].push(value.object_id)
                }
                else {
                    conceptIdsObject[value.concept] = [value.object_id]
                }
            }
        })
        // indicate that concepts are loaded for all values that have no concepts to be mapped to them
        values = values.map((scanReport) => Object.values(conceptIdsObject).find(arr => arr.includes(scanReport.id)) ?
        scanReport : { ...scanReport, conceptsLoaded: true })
        scanReportsRef.current = values
        setScanReports(scanReportsRef.current)

        const conceptIds = chunkIds(Object.keys(conceptIdsObject))
        // make batch call with unique concept ids
        const conceptPromises = []
        for (let i = 0; i < conceptIds.length; i++) {
            conceptPromises.push(useGet(`/omop/conceptsfilter/?concept_id__in=${conceptIds[i].join()}`))
        }
        const conceptPromiseResults = await Promise.all(conceptPromises)
        const omopConcepts = [].concat.apply([], conceptPromiseResults)

        // this query may need to be paginated. Also the endpoint does not actually exist so it is returning
        // all the mapping rules at the moment which works but needs to be fixed
        const mappingRules = await useGet(`/mappingrulesfilter/?concepts__in=${scanreportconcepts.map(item=>item.id).join()}`)
        scanreportconcepts = scanreportconcepts.map(element=>({...element,mappings:mappingRules.filter(el=>el.concept==element.id)}))


        scanreportconcepts = scanreportconcepts.map(element => ({ ...element, concept: omopConcepts.find(con => con.concept_id == element.concept) }))
        // map each scanreport concept to it's value
        values = values.map(element => ({ ...element, conceptsLoaded: true, concepts: scanreportconcepts.filter(concept => concept.object_id == element.id) }))
        scanReportsRef.current = values
        setScanReports(scanReportsRef.current)
        return values
}

// get scan report values for a specific field id
const getScanReports = async (valueId, setScanReports, scanReportsRef, setLoadingMessage, setError) => {
    // query endpoint for field values
    let values = await useGet(`/scanreportvaluesfilter/?scan_report_field=${valueId}`)
    if (!Array.isArray(values)) {
        setError(true)
        return
    }
    // if there are values for this table then sort them and get any concepts associated to them
    if (values.length > 0) {
        values = values.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
        values = values.map(scanReport => ({ ...scanReport, concepts: [], conceptsLoaded: false }))
        scanReportsRef.current = values
        setScanReports(scanReportsRef.current)
        values = await getValuesScanReportConcepts(values,17,scanReportsRef,setScanReports)
        setScanReports(scanReportsRef.current)
        return values
    }
    else {
        // return if there are no scan reports
        scanReportsRef.current = [undefined]
        setScanReports([undefined])
    }
}

// function to save mapping rules copying python implementation
const saveMappingRules = async (scan_report_concept,scan_report_value,table) => {
    const domain = scan_report_concept.concept.domain_id.toLowerCase()
    const fields = await useGet(`/omopfields/`)
    const cachedOmopFunction = mapConceptToOmopField()
    const m_date_field_mapper = {
        'person': ['birth_datetime'],
        'condition_occurrence': ['condition_start_datetime','condition_end_datetime'],
        'measurement':['measurement_datetime'],
        'observation':['observation_datetime'],
        'drug_exposure':['drug_exposure_start_datetime','drug_exposure_end_datetime'],
	'procedure_occurrence':['procedure_datetime'],
	'specimen':['specimen_datetime']
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
        creation_type:"M",
    }
    // create mapping rule for the following
    //person_id
    data.omop_field = fields.filter(field=> field.field == "person_id" && field.table==destination_field.table)[0].id
    data.source_field = table.person_id
    promises.push(usePost(`/mappingrules/`,data))
    //date_event
    data.source_field = table.date_event
    const omopTable = await useGet(`/omoptables/${destination_field.table}/`)
    const date_omop_fields = m_date_field_mapper[omopTable.table]
    date_omop_fields.forEach(element => {
        data.omop_field = fields.filter(field=> field.field == element && field.table==destination_field.table)[0].id
        promises.push(usePost(`/mappingrules/`,data))
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
    promises.push(usePost(`/mappingrules/`,data))
    //_concept_id
    let tempOmopField = await cachedOmopFunction(fields,domain+"_concept_id")
    data.omop_field = tempOmopField.id
    promises.push(usePost(`/mappingrules/`,data))
    //_source_value
    tempOmopField = await cachedOmopFunction(fields,domain+"_source_value")
    data.omop_field = tempOmopField.id
    promises.push(usePost(`/mappingrules/`,data))
    //measurement
    if(domain == 'measurement'){
        tempOmopField = await cachedOmopFunction(fields,"value_as_number","measurement")
        data.omop_field = tempOmopField.id
        promises.push(usePost(`/mappingrules/`,data))
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
                omopTables = await useGet(`/omoptables/`)
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
            omopTables = await useGet(`/omoptables/`)
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
// get field values for a given table id and map any scanreport concepts that are associated
const getScanReportFieldValues = async (valueId, valuesRef) => {
    let response = await useGet(`/scanreportfieldsfilter/?scan_report_table=${valueId}`)
    response = response.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
    if (response.length == 0) {
        return []
    }
    response = await getValuesScanReportConcepts(response,15,valuesRef)
    return response
}

const getScanReportTableRows = async (id) =>{
    // get table rows
    let table = await useGet(`/scanreporttablesfilter/?scan_report=${id}`)
    // if table is empty then return
    if(table.length==0){
        return []
    }
    // sort table
    table = table.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 :0))
    // get ids of scanroport fields that need to be retrieved and do a batch call
    const fieldIdsObject = {}
    table.map(element=>{   
        if(element.person_id){
            fieldIdsObject[element.person_id] = true
        }
        if(element.date_event){
            fieldIdsObject[element.date_event] = true
        }
                    
    })
    if(Object.keys(fieldIdsObject).length == 0){
        return table
    }
    const fieldIds = chunkIds(Object.keys(fieldIdsObject))
    const promises = []
    // send API request for every sublist
    for (let i = 0; i < fieldIds.length; i++) {
        promises.push(useGet(`/scanreportfieldsfilter/?id__in=${fieldIds[i].join()}&fields=id,name`))
    }
    const promiseResult = await Promise.all(promises)
    const fields = [].concat.apply([], promiseResult)
    table = table.map(value=>({...value,person_id:fields.find(field=>field.id==value.person_id),date_event:fields.find(field=>field.id==value.date_event)}))
    return table
}



export { saveMappingRules,useGet,usePost,useDelete,getScanReportFieldValues,chunkIds,
     getScanReportField,getScanReportTable,mapConceptToOmopField,m_allowed_tables,
     getScanReportConcepts,getScanReports,getScanReportTableRows,usePatch,postForm
     }
