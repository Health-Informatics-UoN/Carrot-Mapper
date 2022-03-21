import React from 'react'
import {
    Input, FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react"

const CCTextInput = (props) => {
    /**
     * Reusable text input component.
     * Required args:
     *  id (String): the ID for the input
     *  label (String): the text for the label
     */
    // Check for required arguments
    if (props.id === undefined) {
        throw "`id` must be defined."
    }
    if (props.label === undefined) {
        throw "`label` must be defined."
    }
    // Check handleInput is a function if defined
    if (props.handleInput !== undefined && typeof (props.handleInput) !== 'function') {
        throw "`handleInput` must be a function."
    }
    return (
        <FormControl mt={props.mt} isInvalid={props.formErrors && props.formErrors.length > 0}>
            <FormLabel htmlFor={props.id} style={{ fontWeight: "bold" }}>{props.label}</FormLabel>
            {props.handleInput !== undefined && typeof (props.handleInput) !== 'function' ?
                <Input
                    id={props.id}
                    value={props.value}
                    isReadOnly={props.isReadOnly ? props.isReadOnly : false}
                    onChange={e => props.handleInput(e.target.value)}
                />
                :
                <Input
                    id={props.id}
                    value={props.value}
                    isReadOnly={props.isReadOnly ? props.isReadOnly : false}
                />
            }
            {props.formErrors && props.formErrors.length > 0 &&
                <FormErrorMessage>{props.formErrors[0]}</FormErrorMessage>
            }
        </FormControl>
    )
}

export default CCTextInput