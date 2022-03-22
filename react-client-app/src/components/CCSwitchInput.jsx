import React from 'react'
import {
    Flex, FormControl, FormLabel, Switch, Text
} from "@chakra-ui/react"

const CCSwitchInput = (props) => {
    /**
     * Reusable text input component.
     * Required args:
     *  id (String): the ID for the input
     *  label (String): the text for the label
     *  checkedMessage (String): the text to show when checked
     *  notCheckedMessage (String): the text to show when not checked
     */
    // Check for required arguments
    if (props.id === undefined) {
        throw "`id` must be defined."
    }
    if (props.label === undefined) {
        throw "`label` must be defined."
    }
    if (props.checkedMessage === undefined) {
        throw "`checkedMessage` must be defined."
    }
    if (props.notCheckedMessage === undefined) {
        throw "`notCheckedMessage` must be defined."
    }
    // Check handleInput is a function if defined
    if (props.handleInput !== undefined && typeof (props.handleInput) !== 'function') {
        throw "`handleInput` must be a function."
    }
    return (
        <FormControl mt={4}>
            <FormLabel htmlFor={props.id} style={{ fontWeight: "bold" }}>{props.label}</FormLabel>
            <Flex alignItems={"center"}>
                {props.handleInput !== undefined && typeof (props.handleInput) !== 'function' ?
                    <Switch
                        id={props.id}
                        isChecked={props.isChecked ? props.isChecked : false}
                        isReadOnly={props.isReadOnly ? props.isReadOnly : false}
                        onChange={e => props.handleInput(!props.isChecked)}
                    />
                    :
                    <Switch
                        id={props.id}
                        isChecked={props.isChecked ? props.isChecked : false}
                        isReadOnly={props.isReadOnly ? props.isReadOnly : false}
                    />
                }
                <Text
                    fontWeight={"bold"}
                    ml={2}
                >
                    {props.isChecked ? props.checkedMessage : props.notCheckedMessage}
                </Text>
            </Flex>
        </FormControl>
    )
}

export default CCSwitchInput