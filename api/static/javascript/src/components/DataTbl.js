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
import {useValue} from "../api/values.js";
import ConceptTag from "./ConceptTag.js";
import ToastAlert from "./ToastAlert.js";
import axios from "../../_snowpack/pkg/axios.js";
const api = axios.create({
  baseURL: `https://609e52b633eed8001795841d.mockapi.io/`
});
const DataTbl = () => {
  const res = useValue();
  const [conceptId, setConceptId] = useState([]);
  const [alert, setAlert] = useState({hidden: true, title: "", description: "", status: "error"});
  const {isOpen, onOpen, onClose} = useDisclosure();
  useEffect(() => {
    setTimeout(() => {
      onClose();
    }, 5e3);
  }, [alert]);
  const handleChange = (id, value) => {
    const found = conceptId.some((f) => f.id === id);
    if (!found) {
      setConceptId((conceptId2) => [...conceptId2, {
        id,
        value
      }]);
    } else if (found) {
      const obj = conceptId.find((f) => f.id === id);
      obj.value = value;
    }
  };
  const handleSubmit = (id, event) => {
    event.preventDefault();
    const found = conceptId.some((f) => f.id === id);
    const obj = conceptId.find((f) => f.id === id);
    if (!found || obj.value === "") {
      setAlert({
        hidden: false,
        status: "error",
        title: "Input field must not be empty",
        description: "Unsuccessful"
      });
      onOpen();
    } else {
      const obj2 = conceptId.find((f) => f.id === id);
      const value = res.data.find((f) => f.id === id);
      const newArr = value.conceptIds.concat(obj2.value);
      api.put(`/values/${id}`, {
        id: {id},
        value: value.value,
        frequency: value.frequency,
        conceptIds: newArr
      }).then(function(response) {
        {
          res.revalidate();
        }
        setAlert({
          hidden: false,
          status: "success",
          title: "ConceptId linked to the value",
          description: "Response: " + response.status + " " + response.statusText
        });
        onOpen();
      }).then(function(error) {
        if (typeof error !== "undefined" && error.response != null) {
          setAlert({
            status: "error",
            title: "Unable to link Concept id to value",
            description: "Response: " + error.response.status + " " + error.response.statusText
          });
          onOpen();
        }
      });
    }
    setConceptId([]);
  };
  const handleDelete = (id, conceptId2) => {
    const value = res.data.find((f) => f.id === id);
    const test = value.conceptIds.filter((item) => item !== conceptId2);
    api.put(`/values/${id}`, {
      id: {id},
      value: value.value,
      frequency: value.frequency,
      conceptIds: test
    }).then(function(response) {
      {
        res.revalidate();
      }
      setAlert({
        status: "success",
        title: "Concept Id Deleted",
        description: "Response: " + response.status + " " + response.statusText
      });
      onOpen();
    });
  };
  const getValue = (id) => {
    return conceptId.some((f) => f.id === id) ? conceptId.find((f) => f.id == id).value : "";
  };
  if (res.isLoading) {
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
      hidden: alert.hidden,
      title: alert.title,
      status: alert.status,
      description: alert.description
    })), /* @__PURE__ */ React.createElement(Table, {
      variant: "striped",
      colorScheme: "greyBasic"
    }, /* @__PURE__ */ React.createElement(TableCaption, null), /* @__PURE__ */ React.createElement(Thead, null, /* @__PURE__ */ React.createElement(Tr, null, /* @__PURE__ */ React.createElement(Th, null, "Value"), /* @__PURE__ */ React.createElement(Th, null, "Frequency"), /* @__PURE__ */ React.createElement(Th, null, "Concepts"), /* @__PURE__ */ React.createElement(Th, null))), /* @__PURE__ */ React.createElement(Tbody, null, res.data.map((item) => /* @__PURE__ */ React.createElement(Tr, {
      key: item.id
    }, /* @__PURE__ */ React.createElement(Td, null, item.value), /* @__PURE__ */ React.createElement(Td, null, item.frequency), /* @__PURE__ */ React.createElement(Td, null, /* @__PURE__ */ React.createElement(VStack, null, item.conceptIds.map((conceptIds) => /* @__PURE__ */ React.createElement(ConceptTag, {
      conceptId: conceptIds,
      itemId: item.id,
      handleDelete
    })))), /* @__PURE__ */ React.createElement(Td, null, /* @__PURE__ */ React.createElement("form", {
      onSubmit: (e) => handleSubmit(item.id, e)
    }, /* @__PURE__ */ React.createElement(FormControl, null, /* @__PURE__ */ React.createElement(HStack, null, /* @__PURE__ */ React.createElement(NumberInput, {
      min: -1
    }, /* @__PURE__ */ React.createElement(NumberInputField, {
      value: getValue(item.id),
      onChange: ({target}) => handleChange(item.id, target.value),
      placeholder: "New Concept ID"
    })), /* @__PURE__ */ React.createElement(Button, {
      type: "submit",
      backgroundColor: "#3C579E",
      color: "white"
    }, "Add"))))))))));
  }
};
export default DataTbl;
