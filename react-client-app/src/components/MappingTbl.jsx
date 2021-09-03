import React, { useState, useEffect, useRef } from 'react'
import {
    SimpleGrid,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    Tag,
    TagLabel,
    HStack,
    VStack,
    Flex,
    Spinner,
    Link,
    Text
  } from "@chakra-ui/react"

import { ArrowForwardIcon } from '@chakra-ui/icons'
import { getMappingRules,api}  from '../api/values'
import FilterTag from './FilterTag'



const MappingTbl = () => {
    const scan_report_id = window.location.href.split("scanreports/")[1].split("/")[0]
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [mapDiagram, setMapDiagram] = useState({showing:false,image:null});
    const allData = useRef([]);
    const scanReport = useRef(null);
    const popping = useRef(false);
    const [selectedFilter, setFilter] = useState("All");
    const [secondaryFilter, setSecondaryFilter] = useState("All");
    const [secondaryFilters, setSecondaryFilters] = useState([]);
    const destinationFilters =  [   
                                    {name:"All",map_diagram:[]},
                                    {name:"person",map_diagram:[]},
                                    {name:"measurement",map_diagram:[]},
                                    {name:"condition_occurrence",map_diagram:[]},
                                    {name:"observation",map_diagram:[]},
                                    {name:"drug_exposure",map_diagram:[]}
                                ]
    
                                const svg = useRef(null);




    useEffect(() => {
        setInitialData()
        },[]);

    // none of the pushStates should run when it is from window.pop
    useEffect(() => {
        if(loading==false){
        setLoading(true)
        const url = window.location.href
        if(selectedFilter=="All"){
            if(popping.current == false){
            window.history.pushState({}, '', url.split("mapping_rules/")[0]+"mapping_rules/")
            }
        }  
        else{
            if(popping.current == false){
            window.history.pushState({}, '', url.split("mapping_rules/")[0]+"mapping_rules/"+selectedFilter)
            }
        }
        switchFilter(1)
        }
        
    },[selectedFilter]);

    useEffect(() => {
        const url = window.location.href
        if(selectedFilter=="All"){
            setValues(allData.current)
        }
        else{
            let filteredData = allData.current.filter(value => value.omop_field.table.table == selectedFilter)
            if(secondaryFilter!="All"){
                filteredData = filteredData.filter(value=> value.source_field.scan_report_table.name == secondaryFilter) 
                if(popping.current == false){
                window.history.pushState({}, '', 
                url.split("mapping_rules/")[0]+"mapping_rules/"+url.split("mapping_rules/")[1].split("/")[0]+"/"+secondaryFilter)
                }
            }
            else{
                if(popping.current == false){
                window.history.pushState({}, '', 
                url.split("mapping_rules/")[0]+"mapping_rules/"+url.split("mapping_rules/")[1].split("/")[0])
                }
            }
            setValues(filteredData)
        }
        if(svg.current){
            if (svg.current.hasChildNodes()) {
                svg.current.removeChild(mapDiagram.image)
            }
        }
        setMapDiagram(mapDiagram=>({...mapDiagram,image:null}))
    },[secondaryFilter]);

    useEffect(() => {
        if(!mapDiagram.image){
            window.getSVG().then(diagram=>{
                setMapDiagram(mapDiagram=>({...mapDiagram,image:diagram.getElementsByTagName("svg")[0]}))
                if(svg.current){
                    svg.current.appendChild(diagram.getElementsByTagName("svg")[0])
                } 
            })
        }
        else{
            if(svg.current){
                svg.current.appendChild(mapDiagram.image)
            } 
        }
        
    },[mapDiagram]);
    

    window.onpopstate = function(event) {
        popping.current = true
        let filter = window.location.href.split("mapping_rules/") 
            if(filter.length !== 1 && filter[1] != "" ){
                // only gets done if first filter is on
                filter = filter[1].split("/")
                setFilter(filter[0])
                if(filter[1]){
                    // only gets done if 2nd filter is on
                    setSecondaryFilter(filter[1])
                }
                else{
                    setSecondaryFilter("All")
                }
            }
            else{
                setFilter("All")
            }
      };
    const setInitialData = () =>{
        getMappingRules(scan_report_id,allData,switchFilter).then(res=>{
            scanReport.current =res
            let filter = window.location.href.split("mapping_rules/") 
            if(filter.length !== 1 && filter[1] != "" ){
                // only gets done if first filter is on
                filter = filter[1].split("/")
                setFilter(filter[0])
                if(filter[1]){
                    // only gets done if 2nd filter is on
                    setSecondaryFilter(filter[1])
                }
            }
        })
    }

    const refreshRules=()=>{   
        setLoading(true)   
        setLoadingMessage("Refreshing rules") 
        window.refreshRules().then(res=>{
            setLoadingMessage("Rules Refreshed. Getting Mapping Rules")
            allData.current = []
            setValues([])
            popping.current=true
            setFilter("All")
            setSecondaryFilter("All")
            setInitialData()
        })   
        .catch(error=>{
            console.log(error)
        })  
    }

    const downloadMappingJSON=()=>{
        let jsonRules = {}
        jsonRules.metadata = {date_created:new Date().toISOString(),dataset:scanReport.current.dataset}
        
        jsonRules.cdm = {}
        let data = allData.current 
        if(selectedFilter=="All"){
            data =  allData.current 
        }
        else{
            data =  allData.current.filter(value => value.omop_field.table.table == selectedFilter) 
        }
        if(secondaryFilter!="All"){
            data = data.filter(value=> value.source_field.scan_report_table.name == secondaryFilter) 
        }
        // filter the data first then use that
        data.map(object=>{
            const o = object.omop_field.table.table
            if(!jsonRules.cdm[o]){
                jsonRules.cdm[o] = []   
            }
        })
        for (const [key, arr] of Object.entries(jsonRules.cdm)) {
            const idLists = {}
            const filteredData =  data.filter(value => value.omop_field.table.table == key)    
            
            filteredData.map(object=>{
                const field = object.omop_field.field
                const id = object.scanreportconcept.id
                if(!idLists[id]){
                    idLists[id] = {}
                }
                idLists[id][field] = {
                    source_table:object.source_field.scan_report_table.name,
                    source_field:object.source_field.name,
                }
                if(object.omop_field.field.includes("_concept_id")){
                    idLists[id][field].term_mapping = {}
                    idLists[id][field].term_mapping[object.scanreport.value] = object.scanreportconcept.concept.concept_id
                }
            })
            
            for (const [k, ob] of Object.entries(idLists)) {
                jsonRules.cdm[key].push(ob)
            }
        }
            const result = JSON.stringify(jsonRules,null,4)
            const fileName = scanReport.current.data_partner.name+"_"+scanReport.current.dataset+"_structural_mapping";
            const blob =  new Blob([result],{type:'application/json'}); 
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = fileName + ".json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    }

    const switchFilter = (caller)=>{
        let filteredData
        if(selectedFilter=="All"){
            filteredData =  allData.current 
            setSecondaryFilters([])
        }
        else{
            filteredData =  allData.current.filter(value => value.omop_field.table.table == selectedFilter) 
            let temp = filteredData.map(data=> data.source_field.scan_report_table.name)
            temp = [...new Set(temp)]
            if(temp.length==0){
                setSecondaryFilters([])       
            }
            else{
                setSecondaryFilters(["All",...temp])
            }
            
        }  
        if(secondaryFilter=="All"){
        setValues(filteredData)
        if(svg.current){
            if (svg.current.hasChildNodes()) {
                svg.current.removeChild(mapDiagram.image)
            }
        }
        
        setMapDiagram(mapDiagram=>({...mapDiagram,image:null}))
        }
        else{
        popping.current = true
        setSecondaryFilter("All")
        }
        setLoading(false)
        setLoadingMessage("") 
    }
    
    

      
    if (loading){
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage?loadingMessage:"Loading Mapping rules"}</Flex>
                </Flex>
            </div>
        )
    }
    return ( 
        <div >
            <HStack my="10px">
                <Tag size='lg' variant="solid" backgroundColor="#3db28c"
                onClick={() => refreshRules()} style={{cursor:'pointer'}}>
                <TagLabel padding='5px'>Refresh Rules</TagLabel>
                </Tag>
                <Tag size='lg' variant="solid" backgroundColor="#3C579E"
                onClick={() => {downloadMappingJSON()}} style={{cursor:'pointer'}}>
                <TagLabel padding='5px'>Download Mapping JSON</TagLabel>
                </Tag>
                <Tag size='lg' variant="solid" backgroundColor="#ffc107"
                onClick={() => {setMapDiagram(mapDiagram=>({...mapDiagram,showing:!mapDiagram.showing}))}} style={{cursor:'pointer'}}>
                <TagLabel padding='5px'>{mapDiagram.showing?"Hide ":"View "}Map Diagram</TagLabel>
                </Tag>
            </HStack>
            <div>
                <VStack w='full'>
                    <Text fontWeight="bold">Filter on destination table</Text>
                    <SimpleGrid minChildWidth="170px" spacing="10px" w='full'>
                        {destinationFilters.map(filter=>{
                            return <FilterTag key={filter.name} tagName={filter.name} handleClick={setFilter} selected={filter.name==selectedFilter} popping={popping}/>
                        })}
                    </SimpleGrid>
                </VStack>
                {secondaryFilters.length>0&&
                    <VStack w='full'>
                        <Text fontWeight="bold">Filter on source table</Text>
                        <SimpleGrid minChildWidth="170px" spacing="10px" w='full'>
                            {secondaryFilters.map(filter=>{
                                return <FilterTag key={filter} tagName={filter} handleClick={setSecondaryFilter} selected={filter==secondaryFilter} popping={popping}/>
                            })}
                        </SimpleGrid>
                    </VStack>
                }
                {mapDiagram.showing&&
                <>
                    <div style={{marginTop:'10px',marginBottom:'10px'}} ref={svg}/>
                    {values.length>0?
                    <>
                        {mapDiagram.image==null&&
                            <Flex padding="30px">
                                <Spinner />
                                <Flex marginLeft="10px">Loading Map Diagram</Flex>
                            </Flex>
                        }
                    </>
                    :
                    <Flex padding="30px">
                        <Flex marginLeft="10px">No Diagram to load</Flex>
                    </Flex>
                    }
                </>
                }
                
            </div>
            
                <Table variant="striped" colorScheme="greyBasic">
                <TableCaption></TableCaption>
                <Thead>
                    <Tr>
                    <Th>Rule ID</Th>
                    <Th>Destination Table</Th>
                    <Th>Destination Field</Th>
                    <Th>Source Table</Th>
                    <Th>Source Field</Th>
                    <Th>Term Map</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {values.length>0?
                        // Create new row for every value object
                        values.map((item,index) =>
                        <Tr key={index}>
                            <Td>{item.concept} </Td>
                            <Td>{item.omop_field.table.table} </Td>
                            <Td>{item.omop_field.field}</Td>
                            <Td><Link style={{color:"#0000FF",}} href={window.u+"fields/?search="+item.source_field.scan_report_table.id}>{item.source_field?item.source_field.scan_report_table.name:null}</Link></Td>
                            <Td><Link style={{color:"#0000FF",}} href={window.u+"values/?search="+item.source_field.id}>{item.source_field?item.source_field.name:null}</Link></Td>
                            <Td>
                                {item.omop_field.field.includes("_concept_id")?
                                    <>
                                        {item.scanreport&&
                                            <VStack>
                                                <div><span style={{color:"#dd5064",}}>"{item.scanreport.value}"</span><ArrowForwardIcon/><span style={{color:"#1d8459",}}>{item.scanreportconcept.concept.concept_id}</span></div>
                                            </VStack>
                                        }
                                    </>
                                    :
                                    null
                                }
                            </Td>
                        </Tr>
                        
                        )
                        :
                        <Flex padding="30px">         
                            <Flex marginLeft="10px">Nothing</Flex>
                        </Flex>
                    }
                </Tbody>
                </Table>
            </div>
     );
}
 
export default MappingTbl;