import React, { useState, useEffect, useRef } from 'react'
import { Flex, Spinner, Table, Thead, Tbody, Tr, Th, Td, Spacer, TableCaption, Link, Button, HStack, Select, Text } from "@chakra-ui/react"
import { useGet, usePatch, chunkIds } from '../api/values'
import PageHeading from './PageHeading'
import ConceptTag from './ConceptTag'
import moment from 'moment';

const DatasetTbl = (props) => {
    const [datasets, setDatasets] = useState({})
    const [loadingMessage, setLoadingMessage] = useState("Loading Datasets")
    const [datapartnerFilter, setDataPartnerFilter] = useState("All");
    const [title, setTitle] = useState("Datasets");

    useEffect(async () => {
        // run on initial page load
        props.setTitle(null);
        // get datasets and sort by id
        let datasets = await useGet(`/datasets/`);
        datasets = datasets.sort((b, a) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
        setDatasets(datasets);
        // for each dataset use the data partner and admin ids to get name to display
        // get list of unique data partner and admin ids
        const adminObject = {};
        datasets.map((dataset) => {
            adminObject[dataset.admin] = true;
            const created_at = {};
            created_at.created_at = dataset.created_at;
            created_at.displayString = moment(dataset.created_at.toString()).format("MMM. DD, YYYY, h:mm a");
            dataset.created_at = created_at;
        });

        const dataPartnerObject = {};
        datasets.map((dataset) => {
            dataPartnerObject[dataset.data_partner] = true;
        });
        const dataPartnerIds = chunkIds(Object.keys(dataPartnerObject));
        const dataPartnerPromises = [];
        for (let i = 0; i < dataPartnerIds.length; i++) {
            dataPartnerPromises.push(useGet(`/datapartners/?id__in=${dataPartnerIds[i].join()}`));
        }
        let dataPartners = await Promise.all(dataPartnerPromises)
        dataPartners = dataPartners[0]
        dataPartners.forEach((element) => {
            datasets = datasets.map((dataset) => dataset.data_partner == element.id ? { ...dataset, data_partner: element } : dataset);
        });
        setDatasets(datasets);
        setLoadingMessage(null);

    }, []);

    const applyFilters = (variable) => {
        let newData = variable.map(dataset => dataset)

        if (datapartnerFilter !== "All") {
            newData = newData.filter(dataset => dataset.data_partner.name === datapartnerFilter)
        }
        return newData
    }

    const removeFilter = (a, b) => {
        if (a.includes("Data Partner")) {
            setDataPartnerFilter("All")
        }
    }

    if (loadingMessage) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage}</Flex>
                </Flex>
            </div>
        )
    }

    return (
        <div>
            <Flex>
                <PageHeading text={title} />
                <Spacer />
            </Flex>
            <HStack>
                <Text style={{ fontWeight: "bold" }}>Applied Filters: </Text>
                {[{ title: "Data Partner -", filter: datapartnerFilter }].map(filter => {
                    if (filter.filter === "All") {
                        return null
                    }
                    else {
                        return (
                            <ConceptTag key={filter.title} conceptName={filter.filter} conceptId={filter.title} conceptIdentifier={filter.title} itemId={filter.title} handleDelete={removeFilter} />
                        )
                    }
                })}
            </HStack>
            <Table w="100%" variant="striped" colorScheme="greyBasic">
                <TableCaption></TableCaption>
                <Thead>
                    <Tr className={"mediumTbl"}>
                        <Th style={{ fontSize: "16px" }}>ID</Th>
                        <Th>Name</Th>
                        <Select minW="130px" style={{ fontWeight: "bold" }} variant="unstyled" value="Data Partner" readOnly onChange={(option) => setDataPartnerFilter(option.target.value)}>
                            <option style={{ fontWeight: "bold" }} disabled>Data Partner</option>
                            <>
                                {[...[...new Set(datasets.map(data => data.data_partner.name))]].sort((a, b) => a.localeCompare(b))
                                    .map((item, index) =>
                                        <option key={index} value={item}>{item}</option>
                                    )}
                            </>
                        </Select>
                        <Th>Visibility</Th>
                        <Th>Creation Date</Th>
                        <Th>Details</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {applyFilters(datasets).length > 0 &&
                        applyFilters(datasets).map((item, index) =>

                            <Tr className={"mediumTbl"} key={index}>
                                <Td maxW={"100px"}><Link style={{ color: "#0000FF", }} href={"/datasets/" + item.id}>{item.id}</Link></Td>
                                <Td maxW={"100px"}><Link style={{ color: "#0000FF", }} href={"/datasets/" + item.id}> {item.name}</Link></Td>
                                <Td maxW={"100px"}> {item.data_partner.name} </Td>
                                <Td maxW={"100px"}> {item.visibility} </Td>
                                <Td maxW={"200px"} minW={"180px"}>{item.created_at.displayString}</Td>
                                <Td maxW={"100px"}><Link href={"/datasets/" + item.id + "/details"}><Button variant="blue" my="10px">Details</Button></Link>
                                </Td>
                            </Tr>

                        )
                    }
                </Tbody>
            </Table>
        </div>
    );
}

export default DatasetTbl;