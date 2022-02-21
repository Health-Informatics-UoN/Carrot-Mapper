import React, { useState, useEffect } from 'react'
import { Checkbox, HStack, Text, Button, Flex, Spinner, VStack, Textarea } from "@chakra-ui/react"
import { useGet, usePatch } from '../api/values'
const EditField = ({ setTitle }) => {
    const value = window.location.href.split("fields/")[1].split("/")[0]
    const [field, setField] = useState(null);
    const [isIgnore, setIsIgnore] = useState(false);
    const [passFromSource, setPassFromSource] = useState(false);
    const [descriptionColumn, setDescriptionColumn] = useState("")
    const [loadingMessage, setLoadingMessage] = useState("Loading Page")

    useEffect(async () => {
        // get scan report field to use to set initial values
        const scanreportfield = await useGet(`/scanreportfields/${value}/`)
        // set initial values
        setLoadingMessage(null)
        setTitle("Update Field - " + scanreportfield.name)
        setField(scanreportfield)
        setIsIgnore(scanreportfield.is_ignore)
        setPassFromSource(scanreportfield.pass_from_source)
        setDescriptionColumn(scanreportfield.description_column)
    }, []);

    const updateField = () => {
        // update field then redirect
        setLoadingMessage("Updating field")
        const data =
        {
            is_ignore: isIgnore,
            pass_from_source: passFromSource,
            description_column: descriptionColumn
        }
        // use endpoint to change scan report field value
        usePatch(`/scanreportfields/${value}/`, data).then((res) => {
            // redirect
            window.location.href= `${window.u}fields/?search=${field.scan_report_table}`
        })
            .catch(err => {
                console.log(err)
            })
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
            <VStack mt="20px" align="start">
                <Checkbox isChecked={isIgnore} onChange={(e) => setIsIgnore(e.target.checked)}>Is ignore</Checkbox>
                <Checkbox isChecked={passFromSource} onChange={(e) => setPassFromSource(e.target.checked)}>Pass from source</Checkbox>
            </VStack>
            <VStack mt="20px" align="start">
                <Text w="200px">Description Column</Text>
                <Textarea value={descriptionColumn} onChange={(e) => setDescriptionColumn(e.target.value)} />
            </VStack>
            <Button bgColor="#3db28c" mt="10px" onClick={updateField}>Update</Button>
        </div>
    );
}

export default EditField;