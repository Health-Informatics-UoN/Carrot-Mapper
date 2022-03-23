import React, { useState } from 'react'
import {
    Flex, FormControl, FormLabel, FormErrorMessage, Select
} from "@chakra-ui/react"

const CCMultiSelectInput = (props) => {
    /**
     * Reusable multiple select input component.
     * 
     * Required args:
     *  id (String): the ID for the input.
     *  label (String): the text for the label.
     *  selectOptions (Array): the options to choose from.
     *  handleInput (Function): the action to perform when the input changes.
     * 
     * Optional args:
     *  currentSelections (Array): choices that are already selected. Default: `[]`
     *  isDisabled (Boolean): input is disabled or not. Default: `false`
     */
    // Check for required arguments
    if (!props.id) {
        throw "`id` must be defined."
    }
    if (!props.label) {
        throw "`label` must be defined."
    }
    if (!props.selectOptions) {
        throw "`selectOptions` must be defined."
    }
    // Check handleInput is defined and a functions
    if (!props.handleInput || typeof (props.handleInput) !== 'function') {
        throw "`handleInput` must be a function."
    }

    // Check optional arguments
    const [currentSelections, setCurrentSelections] = useState(
        props.currentSelections ? props.currentSelections : []
    )

    return (
        <FormControl isInvalid={props.formErrors && props.formErrors.length > 0} mt={4}>
            <Flex flexWrap={true}>
                <FormLabel htmlFor={props.id} w="200px" style={{ fontWeight: "bold" }}>{props.label}</FormLabel>
                {currentSelections.map((item, index) => {
                    return (
                        <div key={index} style={{ marginTop: "0px" }}>
                            <ConceptTag
                                conceptName={item}
                                conceptId={""}
                                conceptIdentifier={item}
                                itemId={item}
                                handleDelete={
                                    setCurrentSelections(
                                        () => currentSelections.filter(element => element !== item)
                                    )
                                }
                            />
                        </div>
                    )
                })}
            </Flex>
            {!props.isDisabled &&
                <Select
                    value={"---Select---"}
                    isReadOnly={true}
                    onChange={
                        (e) => props.handleInput(currentSelections)
                    }
                    isDisabled={props.isDisabled ? props.isDisabled : false}
                >
                    <option disabled>---Select---</option>
                    {props.selectOptions.map((item, index) =>
                        <option key={index} value={item}>{item}</option>
                    )}
                </Select>
            }
            {props.formErrors && props.formErrors.length > 0 &&
                <FormErrorMessage>{props.formErrors[0]}</FormErrorMessage>
            }
        </FormControl>
    )
}

export default CCMultiSelectInput