import React, { useState, useEffect } from 'react'
import { Button, Flex, Spinner } from "@chakra-ui/react"
import CCSelectInput from './CCSelectInput'
import { useGet, usePatch } from '../api/values'
const EditTable = () => {
    const value = window.location.href.split("tables/")[1].split("/")[0]
    const [fields, setFields] = useState(null);
    const [table, setTable] = useState(null);
    const [selectedPerson, setPerson] = useState("------");
    const [selectedDate, setDate] = useState("------");
    const [loadingMessage, setLoadingMessage] = useState(null)
    const canEdit = window.canEdit

    useEffect(async () => {
        // get scan report table to use to get tables 
        const scanreporttable = await useGet(`/scanreporttables/${value}/`)
        // get scan report tables for the scan report the table belongs to
        const tablesFilter = useGet(`/scanreporttablesfilter/?scan_report=${scanreporttable.scan_report}`)
        // get all fields for the scan report table
        const fieldsFilter = useGet(`/scanreportfieldsfilter/?scan_report_table=${value}&fields=name,id`)
        const promises = await Promise.all([tablesFilter, fieldsFilter])
        let options = promises[1]
        let tables = promises[0]
        // sort the options alphabetically
        options = options.sort((a, b) => a.name.localeCompare(b.name))
        // add a null option to use to set person_id or date_event to null
        const nullfield = { name: "------", id: null }
        options = [nullfield, ...options]
        setFields(options)
        // set initial values to current values in the database
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
        usePatch(`/scanreporttables/${value}/`, data).then((res) => {
            // redirect
            window.location.href = `/tables/?search=${table.scan_report}`
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
            <CCSelectInput
                id={"table-person-id"}
                label={"Person ID"}
                selectOptions={fields.map((item) => item.name)}
                handleInput={setPerson}
                isDisabled={!canEdit}
            />
            <CCSelectInput
                id={"table-date-event"}
                label={"Date Event"}
                selectOptions={fields.map((item) => item.name)}
                handleInput={setDate}
                isDisabled={!canEdit}
            />
            {canEdit &&
                <Button
                    bgColor="#3db28c"
                    mt="10px"
                    onClick={updateTable}
                >
                    Update {table.name}
                </Button>
            }
        </div>
    );
}

export default EditTable;