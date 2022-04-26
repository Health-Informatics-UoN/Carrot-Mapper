import React from 'react'
import ConceptTag from './ConceptTag'
import {
    Flex, FormControl, FormLabel, FormErrorMessage, Select, Tooltip, Box, Wrap, WrapItem
} from "@chakra-ui/react"
import { InfoIcon } from '@chakra-ui/icons'

const CCMultiSelectInput = (props) => {
    /**
     * Reusable multiple select input component.
     * 
     * Required args:
     *  id (String): the ID for the input.
     *  label (String): the text for the label.
     *  selectOptions (Array): the options to choose from.
     *  handleInput (Function): the action to perform when the input changes.
     *  handleDelete (Function): the action to perform to remove a selection.
     * 
     * Optional args:
     *  currentSelections (Array): choices that are already selected. Default: `[]`
     *  isDisabled (Boolean): input is disabled or not. Default: `false`
     *  formErrors (Array): the errors to display when the input is invalid. Default: `undefined`
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
    // Check handleDelete is defined and a functions
    if (!props.handleDelete || typeof (props.handleDelete) !== 'function') {
        throw "`handleDelete` must be a function."
    }

    return (
        <FormControl isInvalid={props.formErrors && props.formErrors.length > 0} mt={4}>
                <Wrap >
                    <FormLabel htmlFor={props.id} mr={4} style={{ fontWeight: "bold" }}>{props.label}</FormLabel>
                    {props.info &&
                        <Tooltip label={props.info}>
                            <InfoIcon ml="auto" mt="auto" mb="2px" />
                        </Tooltip>
                    }
                    {props.currentSelections.map((item, index) => {
                        return (
                            <WrapItem key={index} marginBottom="10px">
                                <ConceptTag
                                    conceptName={item}
                                    conceptId={""}
                                    conceptIdentifier={item}
                                    itemId={item}
                                    handleDelete={() => props.handleDelete(item)}
                                    readOnly={props.isDisabled}
                                />
                            </WrapItem>
                        )
                    })}
                </Wrap>

            
            {!props.isDisabled &&
                <Select
                    value={"---Select---"}
                    isReadOnly={true}
                    onChange={
                        (e) => props.handleInput(e.target.value)
                    }
                    isDisabled={props.isDisabled ? props.isDisabled : false}
                >
                    <option disabled>---Select---</option>
                    {props.selectOptions.map((item, index) =>
                        <option key={index} value={item}>{item}</option>
                    )}
                </Select>
            }
            {
                props.formErrors && props.formErrors.length > 0 &&
                <FormErrorMessage>{props.formErrors[0]}</FormErrorMessage>
            }
        </FormControl >
    )
}

export default CCMultiSelectInput