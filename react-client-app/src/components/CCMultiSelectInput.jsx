import React from 'react'
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
     *  handleDelete (Function): the action to perform to remove choices.
     * 
     * Optional args:
     *  currentSelections (Array): choices that are already selected.
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
    // Check handleInput is defined and a functions
    if (!props.handleDelete || typeof (props.handleDelete) !== 'function') {
        throw "`handleDelete` must be a function."
    }

    return (
        <FormControl isInvalid={props.formErrors && props.formErrors.length > 0} mt={4}>
            <Flex flexWrap={true}>
                <FormLabel htmlFor={props.id} w="200px">{props.label}</FormLabel>
                {currentSelections.map((item, index) => {
                    return (
                        <div key={index} style={{ marginTop: "0px" }}>
                            <ConceptTag
                                conceptName={item}
                                conceptId={""}
                                conceptIdentifier={item}
                                itemId={item}
                                handleDelete={props.handleDelete}
                            />
                        </div>
                    )
                })}
            </Flex>
            <Select
                value={"---Select---"}
                isReadOnly={true}
                onChange={
                    (option) => props.handleInput(option.target.value)
                }
                isDisabled={props.isDisabled ? props.isDisabled : false}
            >
                {props.selectOptions.map((item, index) =>
                    <option key={index} value={item}>{item}</option>
                )}
            </Select>
            {props.formErrors && props.formErrors.length > 0 &&
                <FormErrorMessage>{props.formErrors[0]}</FormErrorMessage>
            }
        </FormControl>
    )
}

export default CCMultiSelectInput