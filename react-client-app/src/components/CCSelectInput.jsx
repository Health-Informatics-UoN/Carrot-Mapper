import React from 'react'
import {
    FormControl, FormLabel, FormErrorMessage, Select
} from "@chakra-ui/react"

const CCSelectInput = (props) => {
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
    if (props.value === undefined) {
        throw "`value` must be defined."
    }
    // Check handleInput is a function if defined
    if (props.handleInput !== undefined && typeof (props.handleInput) !== 'function') {
        throw "`handleInput` must be a function."
    }
    return (
        <FormControl isInvalid={props.formErrors && props.formErrors.length > 0} mt={4}>
            <FormLabel htmlFor={props.id} w="200px" style={{ fontWeight: "bold" }}>{props.label}</FormLabel>
            {props.handleInput !== undefined && typeof (props.handleInput) === 'function' ?
                <Select
                    value={props.value}
                    onChange={
                        (option) => props.handleInput(option.target.value)
                    }
                    isDisabled={props.isDisabled ? props.isDisabled : false}
                >
                    {props.selectOptions.map((item, index) =>
                        <option key={index} value={item}>{item}</option>
                    )}
                </Select>
                :
                <Select
                    value={props.value}
                    isDisabled={props.isDisabled ? props.isDisabled : false}
                >
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

export default CCSelectInput