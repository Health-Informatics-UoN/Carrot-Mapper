import React from 'react'
import {
    Input, FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react"

const CCTextInput = (props) => {
    /**
     * Reusable text input component.
     * 
     * Required args:
     *  id (String): the ID for the input.
     *  label (String): the text for the label.
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
    // Check handleInput is defined and a function
    if (!props.handleInput || typeof (props.handleInput) !== 'function') {
        throw "`handleInput` must be a function."
    }
    return (
        <FormControl mt={4} isInvalid={props.formErrors && props.formErrors.length > 0}>
            <FormLabel htmlFor={props.id} style={{ fontWeight: "bold" }}>{props.label}</FormLabel>
            <Input
                id={props.id}
                value={props.value}
                isDisabled={props.isDisabled ? props.isDisabled : false}
                onChange={e => props.handleInput(e.target.value)}
            />
            {props.formErrors && props.formErrors.length > 0 &&
                <FormErrorMessage>{props.formErrors[0]}</FormErrorMessage>
            }
        </FormControl>
    )
}

export default CCTextInput