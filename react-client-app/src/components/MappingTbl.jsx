import React, { useState, useEffect, useRef } from 'react'
import {
    Flex,
    Spinner,
    Link,
    Wrap,
    Button,
    useDisclosure,
} from "@chakra-ui/react"

import { ArrowForwardIcon } from '@chakra-ui/icons'
import { useGet, usePost } from '../api/values'
import ConceptTag from './ConceptTag'
import MappingModal from './MappingModal'
import AnalysisModal from './AnalysisModal'
import SummaryTbl from './SummaryTbl'
import RulesTbl from './RulesTbl'
import ConceptAnalysis from './ConceptAnalysis'
import PageHeading from './PageHeading'
import CCBreadcrumbBar from './CCBreadcrumbBar'



const MappingTbl = (props) => {
    const pathArray = window.location.pathname.split("/")
    const scan_report_id = pathArray[pathArray.length - 3]
    const scanReportName = useRef(null);
    const [values, setValues] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(undefined);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [mapDiagram, setMapDiagram] = useState({ showing: false, image: null });
    const svg = useRef(null);
    const [destinationTableFilter, setDestinationTableFilter] = useState([]);
    const [sourceTableFilter, setSourceTableFilter] = useState([]);
    const [filters, setFilters] = useState([]);
    const [isDownloading, setDownloading] = useState(false);
    const [isDownloadingCSV, setDownloadingCSV] = useState(false);
    const [isDownloadingImg, setDownloadingImg] = useState(false);
    const downLoadingImgRef = useRef(false)
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isOpen: isOpenAnalyse, onOpen: onOpenAnalyse, onClose: onCloseAnalyse } = useDisclosure()


    useEffect(() => {
        props.setTitle(null)
        // get scan report
        useGet(`/scanreports/${scan_report_id}`).then(sr => scanReportName.current = sr.dataset)
        // on initial load of the page,
        // get all mapping rules for the page unfiltered
        useGet(`/mappingruleslist/?id=${scan_report_id}`).then(res => { // not sure if this needs a / on the end or not as it's an undocumented endpoint
            setValues(res[0].sort((a, b) => (a.rule_id > b.rule_id) ? 1 : ((b.rule_id > a.rule_id) ? -1 : 0)))
            setLoading(false);
            setLoadingMessage("");
        })
            .catch(err => {
                setLoading(false);
                setLoadingMessage("");
                setError("An error has occured while fetching the rules")
            })
    }, []);

    useEffect(async () => {
        // run when map diagram state has changed
        if (!mapDiagram.image) {
            // if no map diagram is loaded, request to get a new one

            const result = await usePost(window.location.href, { 'get_svg': true }, false);
            const diagramString = await result.data
            var parser = new DOMParser();
            var diagram = parser.parseFromString(diagramString, "text/html");

            setMapDiagram((mapDiagram2) => ({ ...mapDiagram2, image: diagram.getElementsByTagName("svg")[0] }));
            if (svg.current) {
                if (svg.current.hasChildNodes()) {
                    while (svg.current.firstChild) {
                        svg.current.removeChild(svg.current.lastChild);
                    }
                }
                svg.current.appendChild(diagram.getElementsByTagName("svg")[0]);
            }
            if (downLoadingImgRef.current == true) {
                downloadImage(diagram.getElementsByTagName("svg")[0]);
            }
        }
        else {
            if (svg.current) {
                if (svg.current.hasChildNodes()) {
                    // remove all other diagrams if they exist
                    while (svg.current.firstChild) {
                        svg.current.removeChild(svg.current.lastChild);
                    }
                }
                svg.current.appendChild(mapDiagram.image)
            }
        }
    }, [mapDiagram]);


    // call refresh rules function from django then get new data
    const refreshRules = async () => {
        setLoading(true)
        setLoadingMessage("Refreshing rules")
        try {
            await usePost(window.location.href, { 'refresh_rules': true }, false)
            setLoadingMessage("Rules Refreshed. Getting Mapping Rules")
            window.location.reload(true)
        }
        catch (err) {
            console.log(err)
        }

    }
    // download map diagram
    const downloadImage = (img) => {
        setDownloadingImg(true);
        if (mapDiagram.image || img) {
            let svg2;
            if (img) {
                svg2 = img;
            } else {
                svg2 = mapDiagram.image;
            }
            var serializer = new XMLSerializer();
            var source = serializer.serializeToString(svg2);
            if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
            var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
            var element = document.createElement("a");
            element.download = "diagram.svg";
            element.href = url;
            element.click();
            element.remove();
            setDownloadingImg(false);
            downLoadingImgRef.current = false;
        } else {
            downLoadingImgRef.current = true;
        }
    };

    // apply destination table and source table filters to data
    const applyFilters = (variable) => {
        let newData = variable.map((scanreport) => scanreport);
        if (destinationTableFilter.length > 0) {
            newData = newData.filter((rule) => destinationTableFilter.includes(rule.destination_table.name));
        }
        if (sourceTableFilter.length > 0) {
            newData = newData.filter((rule) => sourceTableFilter.includes(rule.source_table.name));
        }
        return newData;
    };

    // if filter does not already exist, create a new destination table filter
    // and get a new map diagram
    const setDestinationFilter = (value) => {
        if (filters.find(filter => filter.name == value) == null) {
            setFilters(current => [...current, { title: "Destination Table:", name: value }])
            setDestinationTableFilter(current => [...current, value])

        }
    };
    // if filter does not already exist, create a new source table filter
    // and get a new map diagram
    const setSourceFilter = (value) => {
        if (filters.find(filter => filter.name == value) == null) {
            setFilters(current => [...current, { title: "Source Table:", name: value }])
            setSourceTableFilter(current => [...current, value])

        }

    };
    // remove a filter. Called inside concept tag
    const removeFilter = (title, name) => {
        setFilters(current => current.filter(filter => filter.name != name || filter.title != title))

        if (title.includes("Destination Table")) {
            setDestinationTableFilter(current => current.filter(filter => filter != name))
        }
        if (title.includes("Source Table")) {
            setSourceTableFilter(current => current.filter(filter => filter != name))
        }
    };

    const downloadRules = async () => {
        try {
            setDownloading(true)
            const response = await usePost(window.location.href, { 'download_rules': true }, false)
            var type = response.headers['content-type'];
            var blob = new Blob([JSON.stringify(response.data, null, 6)], { type: type });

            // check for a filename
            var filename = "";
            var disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
            }


            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                window.navigator.msSaveBlob(blob, filename);
            }
            else {
                var URL = window.URL || window.webkitURL;
                var downloadUrl = URL.createObjectURL(blob);
                if (filename) {
                    // use HTML5 a[download] attribute to specify filename
                    var a = document.createElement("a");
                    // safari doesn't support this yet
                    if (typeof a.download === 'undefined') {
                        window.location.href = downloadUrl;
                    }
                    else {
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                    }
                }
                else {
                    window.location = downloadUrl;
                }
                setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup

            }
            setDownloading(false)
        }
        catch (err) {
            setDownloading(false)
            alert("Could not download rules")
        }

    };

    const downloadCSV = async () => {
        try {
            setDownloadingCSV(true)
            const response = await usePost(window.location.href, { 'download_rules_as_csv': true }, false)
            var type = response.headers['content-type'];
            var blob = new Blob([response.data], { type: type });

            // check for a filename
            var filename = "";
            var disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
            }


            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                window.navigator.msSaveBlob(blob, filename);
            }
            else {
                var URL = window.URL || window.webkitURL;
                var downloadUrl = URL.createObjectURL(blob);
                if (filename) {
                    // use HTML5 a[download] attribute to specify filename
                    var a = document.createElement("a");
                    // safari doesn't support this yet
                    if (typeof a.download === 'undefined') {
                        window.location.href = downloadUrl;
                    }
                    else {
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                    }
                }
                else {
                    window.location = downloadUrl;
                }
                setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup

            }
            setDownloadingCSV(false)
        }
        catch (err) {
            setDownloadingCSV(false)
            alert("Could not download csv")
        }

    }

    useEffect(() => {
        useGet(`/analyse/${scan_report_id}`).then(res => { // not sure if this needs a / on the end or not as it's an undocumented endpoint
            setData(res.data)
            setLoading(false);
            setLoadingMessage("");

        })
            .catch(err => {
                setLoading(false);
                setLoadingMessage("");
                setError("An error has occured while fetching the rules")
            })

    }, []);

    if (loading) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage ? loadingMessage : "Loading Mapping rules"}</Flex>
                </Flex>
            </div>
        )
    }
    return (
        <div >
            <MappingModal isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
                <SummaryTbl values={values}
                    filters={filters} removeFilter={removeFilter} setDestinationFilter={setDestinationFilter} setSourceFilter={setSourceFilter}
                    destinationTableFilter={destinationTableFilter} sourceTableFilter={sourceTableFilter} scanReportId={scan_report_id} />
            </MappingModal>
            <AnalysisModal isOpenAnalyse={isOpenAnalyse} onOpenAnalyse={onOpenAnalyse} onCloseAnalyse={onCloseAnalyse}>
                <ConceptAnalysis data={data} />
            </AnalysisModal>
            <CCBreadcrumbBar>
                <Link href={"/"}>Home</Link>
                <Link href={"/scanreports"}>Scan Reports</Link>
                <Link href={`/scanreports/${scan_report_id}`}>{scanReportName.current}</Link>
                <Link href={`/scanreports/${scan_report_id}/mapping_rules/`}>Mapping Rules</Link>
            </CCBreadcrumbBar>
            <PageHeading text={"Mapping Rules"} />
            <Wrap my="10px">
                <Button variant="green" onClick={() => { refreshRules() }}>Refresh Rules</Button>
                <Button variant="blue" isLoading={isDownloading} loadingText="Downloading" spinnerPlacement="start" onClick={downloadRules}>Download Mapping JSON</Button>
                <Button variant="yellow" onClick={() => { setMapDiagram(mapDiagram => ({ ...mapDiagram, showing: !mapDiagram.showing })) }}>{mapDiagram.showing ? "Hide " : "View "}Map Diagram</Button>
                <Button variant="red" isLoading={isDownloadingImg} loadingText="Downloading" spinnerPlacement="start" onClick={() => { downloadImage() }}>Download Map Diagram</Button>
                <Button variant="blue" isLoading={isDownloadingCSV} loadingText="Downloading" spinnerPlacement="start" onClick={downloadCSV}>Download Mapping CSV</Button>
                <Button variant="blue" onClick={onOpen}>Show Summary view</Button>
                <Button variant="blue" onClick={onOpenAnalyse}>Analyse Rules</Button>
            </Wrap>

            <div>
                {mapDiagram.showing &&
                    <>
                        <div style={{ marginTop: '10px', marginBottom: '10px' }} ref={svg} />
                        {values.length > 0 ?
                            <>
                                {mapDiagram.image == null &&
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
            {error ?
                <div>{error}</div>
                :
                <RulesTbl values={values}
                    filters={filters} removeFilter={removeFilter} setDestinationFilter={setDestinationFilter} setSourceFilter={setSourceFilter}
                    destinationTableFilter={destinationTableFilter} sourceTableFilter={sourceTableFilter} applyFilters={applyFilters} scanReportId={scan_report_id} />

            }
        </div>
    );
}

export default MappingTbl;