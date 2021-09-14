import React, { useState, useEffect } from 'react'
import { Select, HStack, Text, Button, Flex, Spinner } from "@chakra-ui/react"
import { useGet, usePatch, api } from '../api/values'
const EditTable = () => {
    const value = window.location.href.split("tables/")[1].split("/")[0]
    const [fields, setFields] = useState(null);
    const [table, setTable] = useState(null);
    const [selectedPerson, setPerson] = useState("------");
    const [selectedDate, setDate] = useState("------");
    const [loadingMessage, setLoadingMessage] = useState(null)

    useEffect(async () => {
        const resp = await useGet(`${api}/scanreporttables/${value}`)
        const t = useGet(`${api}/scanreporttablesfilter/?scan_report=${resp.scan_report}`)
        const res = useGet(`${api}/scanreportfieldsfilter/?scan_report_table=${value}&fields=name,id`)
        const promises = await Promise.all([t, res])
        let options = promises[1]
        let tables = promises[0]
        options = options.sort((a, b) => a.name.localeCompare(b.name))
        const nullfield = { name: "------", id: null }
        options = [nullfield, ...options]
        setFields(options)
        const table = tables.find(table => table.id == value)
        const person_id = options.find(field => field.id == table.person_id)
        const date_event = options.find(field => field.id == table.date_event)
        if (person_id) {
            setPerson(person_id.name)
        }
        if (date_event) {
            setDate(date_event.name)
        }
        setTable(table)

    }, []);

    const updateTable = () => {
        setLoadingMessage("Updating table")
        // update the table then redirect
        const person_id = fields.find(field => field.name == selectedPerson)
        const date_event = fields.find(field => field.name == selectedDate)
        const data =
        {
            person_id: person_id.id,
            date_event: date_event.id
        }
        usePatch(`scanreporttables/${value}/`, data).then((res) => {
            // redirect
            window.location.href = `${window.u}tables/?search=${table.scan_report}`
        })
            .catch(err => {
                console.log(err)
            })
    }
    if (!table || !fields || loadingMessage) {
        //Render Loading State
        return (
            <div>
                <Flex padding="30px">
                    <Spinner />
                    <Flex marginLeft="10px">{loadingMessage ? loadingMessage : "Loading page"}</Flex>
                </Flex>
            </div>
        )
    }
    return (
        <div>
            <HStack>
                <Text w="200px">person_id:</Text>
                <Select value={selectedPerson} onChange={(option) => setPerson(option.target.value)
                } >
                    {fields.map((item, index) =>
                        <option key={index} value={item.name}>{item.name}</option>
                    )}
                </Select>
            </HStack>
            <HStack>
                <Text w="200px">date_event:</Text>
                <Select value={selectedDate} onChange={(option) => setDate(option.target.value)}>
                    {fields.map((item, index) =>
                        <option key={index} value={item.name}>{item.name}</option>
                    )}
                </Select>
            </HStack>
            <Button bgColor="#3db28c" mt="10px" onClick={updateTable}>Update {table.name} </Button>
        </div>
    );
}

export default EditTable;