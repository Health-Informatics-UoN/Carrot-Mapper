import React, { useState, useEffect, useRef } from 'react'
import CCSelectInput from '../components/CCSelectInput'
import CCSwitchInput from '../components/CCSwitchInput'
import CCTextInput from '../components/CCTextInput'
import { useGet, usePatch, useDelete } from '../api/values'


const ScanReportAdminForm = ({ setTitle }) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [alert, setAlert] = useState({ hidden: true, title: '', description: '', status: 'error' })
    const [isAdmin, setIsAdmin] = useState(window.isAdmin)
    const [dataPartners, setDataPartners] = useState();
    const [selectedDataPartner, setSelectedDataPartner] = useState()
    const [isPublic, setIsPublic] = useState()
    const [loadingMessage, setLoadingMessage] = useState("Loading page")
    const [formErrors, setFormErrors] = useState({})


    if (loadingMessage) {
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
        <Container maxW='container.xl'>
            {isOpen &&
                <ScaleFade initialScale={0.9} in={isOpen}>
                    <ToastAlert hide={onClose} title={alert.title} status={alert.status} description={alert.description} />
                </ScaleFade>
            }
            <PageHeading text={`Scan Report #${dataset.id}`} />
            <CCTextInput
                id={"scanreport-name"}
                label={"Name"}
                isReadOnly={!isAdmin}
            />
            <CCSwitchInput
                id={"scanreport-visibility"}
                label={"Visibility"}
                checkedMessage={"PUBLIC"}
                notCheckedMessage={"RESTRICTED"}
            />
            <CCSelectInput
                id={"scanreport-datapartner"}
                label={"Data Partner"}
                isReadOnly={!isAdmin}
            />
            <CCSelectInput
                id={"scanreport-dataset"}
                label={"Dataset"}
                isReadOnly={!isAdmin}
            />
            {isAdmin &&
                <Button isLoading={uploadLoading} loadingText='Uploading' mt="10px" onClick={upload}>Submit</Button>
            }
        </Container>
    )
}

export default ScanReportAdminForm