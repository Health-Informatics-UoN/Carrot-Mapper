import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  Link,
  Spinner,
  useDisclosure,
  ScaleFade,
} from "@chakra-ui/react";
import CCBreadcrumbBar from "./CCBreadcrumbBar";
import CCSelectInput from "./CCSelectInput";
import ToastAlert from "../components/ToastAlert";
import PageHeading from "./PageHeading";
import { useGet, usePatch } from "../api/values";
const EditTable = (props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [alert, setAlert] = useState({
    hidden: true,
    title: "",
    description: "",
    status: "error",
  });
  const value = window.pk
    ? window.pk
    : window.location.href.split("tables/")[1].split("/")[0];
  const [fields, setFields] = useState(null);
  const [table, setTable] = useState(null);
  const [selectedPerson, setPerson] = useState("------");
  const [selectedDate, setDate] = useState("------");
  const [loadingMessage, setLoadingMessage] = useState(null);
  const canEdit = window.canEdit;
  const scanReport = useRef([]);

  useEffect(async () => {
    props.setTitle(null);
    // get scan report table to use to get tables
    const scanreporttable = await useGet(`/scanreporttables/${value}/`);
    // get scan report for name and id for breadcrumbs
    scanReport.current = await useGet(
      `/scanreports/${scanreporttable.scan_report}/`,
    );
    // get scan report tables for the scan report the table belongs to
    const tablesFilter = useGet(
      `/scanreporttables/?scan_report=${scanreporttable.scan_report}`,
    );
    // get all fields for the scan report table
    const fieldsFilter = useGet(
      `/scanreportfields/?scan_report_table=${value}&fields=name,id`,
    );
    const promises = await Promise.all([tablesFilter, fieldsFilter]);
    let options = promises[1];
    let tables = promises[0];
    // sort the options alphabetically
    options = options.sort((a, b) => a.name.localeCompare(b.name));
    // add a null option to use to set person_id or date_event to null
    const nullfield = { name: "------", id: null };
    options = [nullfield, ...options];
    setFields(options);
    // set initial values to current values in the database
    const table = tables.find((table) => table.id == value);
    const person_id = options.find((field) => field.id == table.person_id);
    const date_event = options.find((field) => field.id == table.date_event);
    if (person_id) {
      setPerson(person_id.name);
    }
    if (date_event) {
      setDate(date_event.name);
    }
    setTable(table);
  }, []);

  const updateTable = () => {
    setLoadingMessage("Updating table");
    // update the table then redirect
    const person_id = fields.find((field) => field.name == selectedPerson);
    const date_event = fields.find((field) => field.name == selectedDate);
    const data = {
      person_id: person_id.id,
      date_event: date_event.id,
    };
    usePatch(`/scanreporttables/${value}/`, data)
      .then((res) => {
        // redirect
        window.location.href = `/scanreports/${table.scan_report}/`;
      })
      .catch((err) => {
        setAlert({
          hidden: false,
          status: "error",
          title: "Could not update scan report table",
          description: err.statusText ? err.statusText : "",
        });
        onOpen();
      });
  };
  if (!table || !fields || loadingMessage) {
    //Render Loading State
    return (
      <div>
        <Flex padding="30px">
          <Spinner />
          <Flex marginLeft="10px">
            {loadingMessage ? loadingMessage : "Loading page"}
          </Flex>
        </Flex>
      </div>
    );
  }
  return (
    <div>
      <CCBreadcrumbBar>
        <Link href={"/"}>Home</Link>
        <Link href={"/scanreports/"}>Scan Reports</Link>
        <Link href={`/scanreports/${scanReport.current.id}/`}>
          {scanReport.current.dataset}
        </Link>
        <Link
          href={`/scanreports/${scanReport.current.id}/tables/${table.id}/`}
        >
          {table.name}
        </Link>
        <Link
          href={`/scanreports/${scanReport.current.id}/tables/${table.id}/update/`}
        >
          Update
        </Link>
      </CCBreadcrumbBar>
      <PageHeading text={"Update Table"} />
      {isOpen && (
        <ScaleFade initialScale={0.9} in={isOpen}>
          <ToastAlert
            hide={onClose}
            title={alert.title}
            status={alert.status}
            description={alert.description}
          />
        </ScaleFade>
      )}
      <Flex paddingTop={5} paddingBottom={5}>
        <Alert status="info">
          <AlertIcon />
          Mapping Rules cannot be generated without the Person ID and Date Event
          being set.
          <br />
          Once you set these, Concepts that are reusable will be associated and
          Mapping Rules will be generated.
          <br />
        </Alert>
      </Flex>
      <CCSelectInput
        id={"table-person-id"}
        label={"Person ID"}
        selectOptions={fields.map((item) => item.name)}
        handleInput={setPerson}
        isDisabled={!canEdit}
      />
      <CCSelectInput
        id={"table-date-event"}
        label={"Date Event"}
        selectOptions={fields.map((item) => item.name)}
        handleInput={setDate}
        isDisabled={!canEdit}
      />
      {canEdit && (
        <Button bgColor="#3db28c" mt="10px" onClick={updateTable}>
          Update {table.name}
        </Button>
      )}
    </div>
  );
};

export default EditTable;
