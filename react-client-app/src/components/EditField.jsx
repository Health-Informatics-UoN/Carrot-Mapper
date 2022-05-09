import React, { useState, useEffect, useRef } from 'react'
import { Checkbox, HStack, Link, Text, Button, Flex, Spinner, VStack, Textarea } from "@chakra-ui/react"
import { useGet, usePatch } from '../api/values'
import CCBreadcrumbBar from './CCBreadcrumbBar'
import PageHeading from './PageHeading'
const EditField = ({ setTitle }) => {
    const pathArray = window.location.pathname.split("/")
    const scanReportId = pathArray[pathArray.length - 7]
    const tableId = pathArray[pathArray.length - 5]
    const value = window.pk ? window.pk : window.location.href.split("fields/")[1].split("/")[0]
    const field = useRef([]);
    const [isIgnore, setIsIgnore] = useState(false);
    const [passFromSource, setPassFromSource] = useState(false);
    const [descriptionColumn, setDescriptionColumn] = useState("")
    const [loadingMessage, setLoadingMessage] = useState("Loading Page")
    const table = useRef([])
    const scanReport = useRef([])

    useEffect(async () => {
        // get scan report
        scanReport.current = await useGet(`/scanreports/${scanReportId}/`)
        // get scan report table
        table.current = await useGet(`/scanreporttables/${tableId}/`)
        // get scan report field to use to set initial values
        const scanreportfield = await useGet(`/scanreportfields/${value}/`)
        console.log(scanreportfield)
        // set initial values
        setLoadingMessage(null)
        setTitle(null)
        field.current = scanreportfield
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
            window.location.href = `/scanreports/${scanReportId}/tables/${tableId}/`
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
            <CCBreadcrumbBar>
                <Link href={"/"}>Home</Link>
                <Link href={"/scanreports/"}>Scan Reports</Link>
                <Link href={`/scanreports/${scanReport.current.id}/`}>{scanReport.current.dataset}</Link>
                <Link href={`/scanreports/${scanReport.current.id}/tables/${table.current.id}/`}>{table.current.name}</Link>
                <Link href={`/scanreports/${scanReport.current.id}/tables/${table.current.id}/fields/${field.current.id}/`}>{field.current.name}</Link>
                <Link href={`/scanreports/${scanReport.current.id}/tables/${table.current.id}/fields/${field.current.id}/update/`}>Update</Link>
            </CCBreadcrumbBar>
            <PageHeading text={"Update Field - " + field.current.name} />
            <VStack mt="20px" align="start">
                <Checkbox isChecked={isIgnore} onChange={(e) => setIsIgnore(e.target.checked)} isDisabled={!window.canEdit}>Is ignore</Checkbox>
                <Checkbox isChecked={passFromSource} onChange={(e) => setPassFromSource(e.target.checked)} isDisabled={!window.canEdit}>Pass from source</Checkbox>
            </VStack>
            <VStack mt="20px" align="start">
                <Text w="200px">Description Column</Text>
                <Textarea value={descriptionColumn} onChange={(e) => setDescriptionColumn(e.target.value)} isDisabled={!window.canEdit} />
            </VStack>
            <Button bgColor="#3db28c" mt="10px" onClick={updateField} isDisabled={!window.canEdit}>Update</Button>
        </div>
    );
}

export default EditField;