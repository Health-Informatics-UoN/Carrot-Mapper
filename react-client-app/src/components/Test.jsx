import React from 'react'
import { Formik, Field, Form, ErrorMessage, FieldArray, FormikHelpers as FormikActions } from 'formik'
import { Input, Button, FormControl, FormLabel, FormErrorMessage, Table, Thead, Tbody, Tr, Th, Td, TableCaption, VStack, HStack  } from '@chakra-ui/react';
import ConceptTag from './ConceptTag'

const Test = () => {

    const onClick = (id, concept, index) => {
        console.log(id)
        console.log(concept)
        console.log(index)
    }

    const mockValues = 
    [
        {
         id: "1",
         value: "M",
         frequency: 97,
         conceptIds: [
          2,
          33,
          999
         ]
        },
        {
         id: "2",
         value: "value 2",
         frequency: 87,
         conceptIds: [
          "999"
         ]
        },
        {
         id: "3",
         value: "value 3",
         frequency: 56,
         conceptIds: []
        }
       ]
    return (
        <div>
            {/* Formik component takes the initial values that need to be passed into the form
                and the onSubmit prop with data from form passed in */}
        {mockValues.map((item, index) => (
            <div key={index}>
            <Formik initialValues={{ concept: '' }} onSubmit={(data, actions) => {
                console.log("submit: ", data.concept)
                actions.resetForm();
            }}>
            { ( { values, handleChange, handleBlur, handleSubmit }) => (
                <Form onSubmit={handleSubmit}>
                    <Input
                    name='concept'
                    value={values.concept}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    />

                        <div>
                            <Button type='submit'>Submit</Button>
                        </div>
                    
                    <div>
                    </div>
                    <pre>
                        {JSON.stringify(values, null, 2)}
                    </pre>
                </Form>
            )}  
        </Formik>
            </div>

        ))}
        


  
        </div>

    )};
export default Test;

