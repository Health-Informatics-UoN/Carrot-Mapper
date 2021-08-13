
const authToken = window.a
const delay = ms => new Promise(res => setTimeout(res, ms));
const api = 'http://127.0.0.1:8080/api'

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
const getAllconcepts = async (id,index,setScanReports,newArr) => {
    const response = await fetch(`${api}/scanreportconceptsfilter/?object_id=${id}`,
    {
        method: "GET",
        headers: {Authorization: "Token "+authToken},    
        importance: "low" 
    });
    const conceptList = await response.json()    
    if(conceptList.length>0){
        const promises=[]
        conceptList.forEach((concept,index) => {                
                promises.push(getConcept(concept.concept,concept.id))  
        })
        Promise.all(promises).then((values) => {
            newArr[index].conceptsLoaded = true
            newArr[index].concepts = [...values]
            setScanReports(newArr.map((scanReport,i)=>i==index?{...scanReport,concepts:[...values],conceptsLoaded:true}:scanReport))
        });
    }
    else{
        newArr[index].conceptsLoaded = true
        setScanReports(newArr.map((scanReport,i)=>i==index?{...scanReport,conceptsLoaded:true}:scanReport))      
    }
}



const getScanReportsInOrder = async (valueId,setScanReports,scanReportsRef) =>{
    getScanReportValues(valueId).then((values) => {
        if(values.length>0){     
            const newArr = values.sort((a,b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 :0))
            async function getConceptsInOrder (arr) {   
                scanReportsRef.current = arr.map(scanReport => ({...scanReport, concepts: [],conceptsLoaded:false}))
                setScanReports(scanReportsRef.current) 
                let index=0      
                for (const value of arr) {
                  await getAllconcepts(value.id,index,setScanReports,scanReportsRef.current)  
                  index++
                }
              }
            getConceptsInOrder(newArr)     
        } 
        else{
            return [undefined]
        }  
        
    }) 
}

const getScanReportsWaitToLoad = (valueId,setScanReports,scanReportsRef,setLoadingMessage) =>{  
    getScanReportValues(valueId).then((values) => {
        if(values.length>0){
            let loaded = 0
            const newArr = values.sort((a,b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 :0))
            scanReportsRef.current = newArr.map(scanReport => ({...scanReport, concepts: [],conceptsLoaded:false}))
            //setScanReports(scanReportsRef.current)
            scanReportsRef.current.map(async (value,index) => {                           
                await getScanReportConcepts(value.id).then(concepts => {  
                    if(concepts.length>0){              
                        const promises=[]      
                        concepts.map(async (concept) => {       
                            promises.push(getConcept(concept.concept,concept.id))  
                        })
                        Promise.all(promises).then((values) => {
                            loaded++
                            setLoadingMessage(loaded+"/"+(scanReportsRef.current.length)+" loaded")
                            scanReportsRef.current[index].conceptsLoaded = true
                            scanReportsRef.current[index].concepts = [...values]
                            if(loaded >= scanReportsRef.current.length){
                                setScanReports(scanReportsRef.current.map((scanReport,i)=>i==index?{...scanReport,concepts:[...values],conceptsLoaded:true}:scanReport))
                            }
                            
                          });
                    }
                    else{
                        loaded++
                        //console.log(loaded+"/"+(scanReportsRef.current.length) +" loaded")
                        setLoadingMessage(loaded+"/"+(scanReportsRef.current.length) +" loaded")
                        scanReportsRef.current[index].conceptsLoaded = true
                        
                        if(loaded >= scanReportsRef.current.length){
                            setScanReports(scanReportsRef.current.map((scanReport,i)=>i==index?{...scanReport,conceptsLoaded:true}:scanReport))  
                        }
                            
                    }
                    
                })
            })
        } 
        else{
            // this is what returns if there are no scan reports
            scanReportsRef.current = [undefined]
            setScanReports([undefined])
        }  
        
    })
}

const getScanReports = (valueId,setScanReports,scanReportsRef) =>{  
    getScanReportValues(valueId).then((values) => {
        if(values.length>0){
            const newArr = values.sort((a,b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 :0))
            scanReportsRef.current = newArr.map(scanReport => ({...scanReport, concepts: [],conceptsLoaded:false}))
            setScanReports(scanReportsRef.current)
            scanReportsRef.current.map((value,index) => {                           
                getScanReportConcepts(value.id).then(concepts => {
                    if(concepts.length>0){              
                        const promises=[]      
                        concepts.map(async (concept) => {       
                            promises.push(getConcept(concept.concept,concept.id))  
                        })
                        Promise.all(promises).then((values) => {
                            scanReportsRef.current[index].conceptsLoaded = true
                            scanReportsRef.current[index].concepts = [...values]
                            setScanReports(scanReportsRef.current.map((scanReport,i)=>i==index?{...scanReport,concepts:[...values],conceptsLoaded:true}:scanReport))
                          });
                    }
                    else{
                        scanReportsRef.current[index].conceptsLoaded = true
                        setScanReports(scanReportsRef.current.map((scanReport,i)=>i==index?{...scanReport,conceptsLoaded:true}:scanReport))      
                    }
                    
                })
            })
        } 
        else{
            // this is what returns if there are no scan reports
            scanReportsRef.current = [undefined]
            setScanReports([undefined])
        }  
        
    })
}

const getConceptLoop = async (valueId) =>{ 
    const response = await getScanReportValues(valueId).then((values) => {
        if(values.length>0){
            return values.map(async (value) => {
                return await getScanReportConcepts(value.id).then(concepts => {
                    if(concepts.length>0){           
                        return concepts.map(async (concept) => {
                            return await getConcepts(concept.concept).then(con => { 
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


export { getScanReportValues,getConceptLoop, getScanReportsWaitToLoad,
     getScanReportConcepts, getConcept,getScanReports,authToken,api,
    getScanReportsInOrder }