import React, {useState, useEffect} from "../../_snowpack/pkg/react.js";
import {
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tag,
  TagLabel,
  TagCloseButton,
  Text,
  HStack,
  VStack,
  Stack,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  FormLabel,
  Box,
  Fade,
  ScaleFade,
  useToast,
  FormControl,
  Input,
  useDisclosure,
  Collapse
} from "../../_snowpack/pkg/@chakra-ui/react.js";
import {Formik, Field, Form, ErrorMessage, FieldArray as FormikActions} from "../../_snowpack/pkg/formik.js";
import {useValue, useScanReportValues, getConceptLoop} from "../api/values.js";
import ConceptTag from "./ConceptTag.js";
import ToastAlert from "./ToastAlert.js";
import axios from "../../_snowpack/pkg/axios.js";
const api = axios.create({
  baseURL: `https://609e52b633eed8001795841d.mockapi.io/`
});
const Test = () => {
  const res = useValue();
  const value = 8381;
  const res1 = useScanReportValues(value);
  const [alert, setAlert] = useState({hidden: true, title: "", description: "", status: "error"});
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [concepts, setConcepts] = useState([]);
  useEffect(() => {
    getConceptLoop(value).then((result) => {
      const updatedConceptsState = [];
      for (let i = 0; i < result.length; i++) {
        updatedConceptsState.push([]);
      }
      result.map((a, index) => {
        if (a) {
          a.then((b) => {
            if (b) {
              b.map((c) => {
                c.then((d) => {
                  updatedConceptsState[index].push(d);
                  setConcepts(updatedConceptsState);
                });
              });
            } else if (index == result.length - 1) {
              setConcepts(updatedConceptsState);
            }
          });
        } else {
          setConcepts(updatedConceptsState);
        }
      });
    });
  }, []);
  if (res1.isLoading || res1.isError || concepts.length < 1) {
    return /* @__PURE__ */ React.createElement(Flex, {
      padding: "30px"
    }, /* @__PURE__ */ React.createElement(Spinner, null), /* @__PURE__ */ React.createElement(Flex, {
      marginLeft: "10px"
    }, "Loading Value Data"));
  } else {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ScaleFade, {
      initialScale: 0.9,
      in: isOpen
    }, /* @__PURE__ */ React.createElement(ToastAlert, {
      hide: onClose,
      title: alert.title,
      status: alert.status,
      description: alert.description
    })), /* @__PURE__ */ React.createElement(Table, {
      variant: "striped",
      colorScheme: "greyBasic"
    }, /* @__PURE__ */ React.createElement(TableCaption, null), /* @__PURE__ */ React.createElement(Thead, null, /* @__PURE__ */ React.createElement(Tr, null, /* @__PURE__ */ React.createElement(Th, null, "Value"), /* @__PURE__ */ React.createElement(Th, null, "Frequency"), /* @__PURE__ */ React.createElement(Th, null, "Concepts"), /* @__PURE__ */ React.createElement(Th, null))), /* @__PURE__ */ React.createElement(Tbody, null, res1.data.map((item, index) => /* @__PURE__ */ React.createElement(Tr, {
      key: item.id
    }, /* @__PURE__ */ React.createElement(Td, null, item.value), /* @__PURE__ */ React.createElement(Td, null, item.frequency), /* @__PURE__ */ React.createElement(Td, null, concepts[index].length > 0 && /* @__PURE__ */ React.createElement(VStack, {
      alignItems: "flex-start"
    }, concepts[index].map((concept) => /* @__PURE__ */ React.createElement(ConceptTag, {
      key: concept.concept_id,
      conceptName: concept.concept_name,
      conceptId: concept.concept_id.toString(),
      itemId: concept.concept_id
    })))), /* @__PURE__ */ React.createElement(Td, null, /* @__PURE__ */ React.createElement(Formik, {
      initialValues: {concept: ""},
      onSubmit: (data, actions) => {
        handleSubmit(item.id, data.concept);
        actions.resetForm();
      }
    }, ({values, handleChange, handleBlur, handleSubmit: handleSubmit2}) => /* @__PURE__ */ React.createElement(Form, {
      onSubmit: handleSubmit2
    }, /* @__PURE__ */ React.createElement(HStack, null, /* @__PURE__ */ React.createElement(Input, {
      width: "30%",
      type: "number",
      name: "concept",
      value: values.concept,
      onChange: handleChange,
      onBlur: handleBlur
    }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Button, {
      type: "submit",
      backgroundColor: "#3C579E",
      color: "white"
    }, "Add")))))))))));
  }
};
export default Test;
