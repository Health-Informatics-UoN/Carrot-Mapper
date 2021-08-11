import React, {useState, useEffect, useRef} from "../../_snowpack/pkg/react.js";
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
import {
  getConcept,
  authToken,
  api,
  getScanReports,
  getScanReportConcepts,
  getScanReportsInOrder,
  getScanReportsWaitToLoad
} from "../api/values.js";
import ConceptTag from "./ConceptTag.js";
import ToastAlert from "./ToastAlert.js";
import axios from "../../_snowpack/pkg/axios.js";
const DataTbl = () => {
  const value = window.location.search ? parseInt(new URLSearchParams(window.location.search).get("search")) : 8381;
  const [alert, setAlert] = useState({hidden: true, title: "", description: "", status: "error"});
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [scanReports, setScanReports] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState("");
  const scanReportsRef = useRef([]);
  useEffect(() => {
    getScanReports(value, setScanReports, scanReportsRef, setLoadingMessage);
  }, []);
  const handleSubmit = (id, concept) => {
    if (concept === "") {
      setAlert({
        hidden: false,
        status: "error",
        title: "Input field must not be empty",
        description: "Unsuccessful"
      });
      onOpen();
    } else {
      const value2 = scanReports.find((f) => f.id === id);
      const newArr = value2.concepts.concat(concept);
      scanReportsRef.current = scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, conceptsLoaded: false} : scanReport);
      setScanReports(scanReportsRef.current);
      const data = {
        concept,
        object_id: id,
        content_type: 17
      };
      axios.post(`${api}/scanreportconcepts/`, data, {
        headers: {Authorization: "Token " + authToken}
      }).then(function(response) {
        getScanReportConcepts(id).then((concepts) => {
          if (concepts.length > 0) {
            const promises = [];
            concepts.map((concept2, ind) => {
              promises.push(getConcept(concept2.concept, concept2.id));
            });
            Promise.all(promises).then((values) => {
              scanReportsRef.current = scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, concepts: [...values], conceptsLoaded: true} : scanReport);
              setScanReports(scanReportsRef.current);
              setAlert({
                hidden: false,
                status: "success",
                title: "ConceptId linked to the value",
                description: "Response: " + response.status + " " + response.statusText
              });
              onOpen();
            });
          } else {
            scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, concepts: [], conceptsLoaded: true} : scanReport);
            setScanReports(scanReportsRef.current);
            setAlert({
              hidden: false,
              status: "success",
              title: "ConceptId linked to the value",
              description: "Response: " + response.status + " " + response.statusText
            });
            onOpen();
          }
        });
      }).catch(function(error) {
        scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, conceptsLoaded: true} : scanReport);
        setScanReports(scanReportsRef.current);
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
  };
  const handleDelete = (id, conceptId) => {
    scanReportsRef.current = scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, conceptsLoaded: false} : scanReport);
    setScanReports(scanReportsRef.current);
    axios.delete(`${api}/scanreportconcepts/${conceptId}`, {
      headers: {Authorization: "Token " + authToken}
    }).then(function(response) {
      getScanReportConcepts(id).then((concepts) => {
        if (concepts.length > 0) {
          const promises = [];
          concepts.map((concept) => {
            promises.push(getConcept(concept.concept, concept.id));
          });
          Promise.all(promises).then((values) => {
            scanReportsRef.current = scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, concepts: [...values], conceptsLoaded: true} : scanReport);
            setScanReports(scanReportsRef.current);
            setAlert({
              status: "success",
              title: "Concept Id Deleted",
              description: "Response: " + response.status + " " + response.statusText
            });
            onOpen();
          });
        } else {
          scanReportsRef.current = scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, concepts: [], conceptsLoaded: true} : scanReport);
          setScanReports(scanReportsRef.current);
          setAlert({
            status: "success",
            title: "Concept Id Deleted",
            description: "Response: " + response.status + " " + response.statusText
          });
          onOpen();
        }
      });
    }).catch(function(error) {
      scanReportsRef.current = scanReportsRef.current.map((scanReport) => scanReport.id == id ? {...scanReport, conceptsLoaded: true} : scanReport);
      setScanReports(scanReportsRef.current);
      if (typeof error !== "undefined" && error.response != null) {
        setAlert({
          status: "error",
          title: "Unable to delete Concept id from value",
          description: "Response: " + error.response.status + " " + error.response.statusText
        });
        onOpen();
      }
    });
  };
  if (scanReports.length < 1) {
    return /* @__PURE__ */ React.createElement(Flex, {
      padding: "30px"
    }, /* @__PURE__ */ React.createElement(Spinner, null), /* @__PURE__ */ React.createElement(Flex, {
      marginLeft: "10px"
    }, "Loading Scan Reports ", loadingMessage));
  }
  if (scanReports[0] == void 0) {
    return /* @__PURE__ */ React.createElement(Flex, {
      padding: "30px"
    }, /* @__PURE__ */ React.createElement(Flex, {
      marginLeft: "10px"
    }, "No Scan Reports Found"));
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
    }, /* @__PURE__ */ React.createElement(TableCaption, null), /* @__PURE__ */ React.createElement(Thead, null, /* @__PURE__ */ React.createElement(Tr, null, /* @__PURE__ */ React.createElement(Th, null, "Value"), /* @__PURE__ */ React.createElement(Th, null, "Value Description"), /* @__PURE__ */ React.createElement(Th, null, "Frequency"), /* @__PURE__ */ React.createElement(Th, null, "Concepts"), /* @__PURE__ */ React.createElement(Th, null))), /* @__PURE__ */ React.createElement(Tbody, null, scanReports.map((item, index) => /* @__PURE__ */ React.createElement(Tr, {
      key: item.id
    }, /* @__PURE__ */ React.createElement(Td, null, item.value), /* @__PURE__ */ React.createElement(Td, null, item.value_description), /* @__PURE__ */ React.createElement(Td, null, item.frequency), /* @__PURE__ */ React.createElement(Td, null, item.conceptsLoaded ? item.concepts.length > 0 && /* @__PURE__ */ React.createElement(VStack, {
      alignItems: "flex-start"
    }, item.concepts.map((concept) => /* @__PURE__ */ React.createElement(ConceptTag, {
      key: concept.concept_id,
      conceptName: concept.concept_name,
      conceptId: concept.concept_id.toString(),
      conceptIdentifier: concept.id.toString(),
      itemId: item.id,
      handleDelete
    }))) : /* @__PURE__ */ React.createElement(Flex, null, /* @__PURE__ */ React.createElement(Spinner, null), /* @__PURE__ */ React.createElement(Flex, {
      marginLeft: "10px"
    }, "Loading Concepts"))), /* @__PURE__ */ React.createElement(Td, null, /* @__PURE__ */ React.createElement(Formik, {
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
      disabled: !item.conceptsLoaded,
      backgroundColor: "#3C579E",
      color: "white"
    }, "Add")))))))))));
  }
};
export default DataTbl;
