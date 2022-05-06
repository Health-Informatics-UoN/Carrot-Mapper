import React from 'react'
import {
    FormControl, FormLabel, FormErrorMessage, Select
} from "@chakra-ui/react"

const CCSelectInput = (props) => {
    /**
     * Reusable text input component.
     * 
     * Required args:
     *  id (String): the ID for the input.
     *  label (String): the text for the label.
     *  selectOptions (Array): the options to choose from.
     *  handleInput (Function): the action to perform when the input changes.
     * 
     * Optional args:
     *  isDisabled (Boolean): input is disabled or not. Default: `false`
     *  formErrors (Array): the errors to display when the input is invalid. Default: `undefined`
     */
    // Check for required arguments
    if (props.id === undefined) {
        throw "`id` must be defined."
    }
    if (props.label === undefined) {
        throw "`label` must be defined."
    }
    if (props.selectOptions === undefined) {
        throw "`selectOptions` must be defined."
    }
    // Check handleInput is defined and a functions
    if (!props.handleInput || typeof (props.handleInput) !== 'function') {
        throw "`handleInput` must be a function."
    }
    return (
        <FormControl isInvalid={props.formErrors && props.formErrors.length > 0} mt={4}>
            <FormLabel htmlFor={props.id} w="200px" style={{ fontWeight: "bold" }}>{props.label}</FormLabel>
            <Select
                value={props.value}
                onChange={
                    (option) => props.handleInput(option.target.value)
                }
                isDisabled={props.isDisabled ? props.isDisabled : false}
            >
                {props.selectOptions.map((item, index) =>
                    <option key={index} value={item} disabled={props.disabledOptions.includes(item)}>{item}</option>
                )}
            </Select>
            {props.formErrors && props.formErrors.length > 0 &&
                <FormErrorMessage>{props.formErrors[0]}</FormErrorMessage>
            }
        </FormControl>
    )
}

// Default props
CCSelectInput.defaultProps = {
    disabledOptions: []
};
export default CCSelectInput