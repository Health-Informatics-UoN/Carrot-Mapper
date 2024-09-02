import React, { useState, useEffect, useRef } from "react";
import {
  Center,
  Flex,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spacer,
  TableCaption,
  Link,
  Button,
  HStack,
  Select,
  Text,
  useDisclosure,
  ScaleFade,
} from "@chakra-ui/react";
import { useGet, usePatch } from "../api/values";
import { set_pagination_variables } from "../api/pagination_helpers";
import PageHeading from "../components/PageHeading";
import ConceptTag from "../components/ConceptTag";
import CCBreadcrumbBar from "../components/CCBreadcrumbBar";
import moment from "moment";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import Pagination from "react-js-pagination";
import ToastAlert from "../components/ToastAlert";

const DatasetTbl = (props) => {
  const data = useRef(null);
  const [displayedData, setDisplayedData] = useState(null);
  const activeDatasets = useRef(null);
  const active = useRef(true);
  const [page_size, set_page_size] = useState(10);
  const archivedDatasets = useRef(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading Datasets");
  const [datapartnerFilter, setDataPartnerFilter] = useState("All");
  const [title, setTitle] = useState("Datasets");
  const [alert, setAlert] = useState({
    hidden: true,
    title: "",
    description: "",
    status: "error",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItemsCount, setTotalItemsCount] = useState(null);
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(async () => {
    // run on initial page load
    props.setTitle(null);
    let { local_page, local_page_size } = await set_pagination_variables(
      window.location.search,
      page_size,
      set_page_size,
      currentPage,
      setCurrentPage,
    );

    // set active.current based on the presence of the filter=archived flag.
    if (window.location.search.search("filter=archived") > 0) {
      active.current = false;
      window.history.pushState(
        {},
        "",
        `/datasets/?filter=archived&p=${local_page}&page_size=${local_page_size}`,
      );
    } else {
      active.current = true;
      window.history.pushState(
        {},
        "",
        `/datasets/?p=${local_page}&page_size=${local_page_size}`,
      );
    }

    setFirstLoad(false);
  }, []);

  useEffect(async () => {
    // if not the first load, then load data etc. This clause avoids an initial call using the default values of
    // currentPage and page_size, which is not desired.
    if (!firstLoad) {
      // run on initial page load
      props.setTitle(null);
      window.location.search.search("filter=archived") > 0
        ? (active.current = false)
        : (active.current = true);
      // get datasets and data partners, and sort by id
      let datasets = await useGet(
        `/datasets/datasets_data_partners/?p=${currentPage}&page_size=${page_size}`,
      );
      setTotalItemsCount(datasets.count);
      datasets = datasets.results.sort((b, a) =>
        a.id > b.id ? 1 : b.id > a.id ? -1 : 0,
      );
      // for each dataset use the data partner and admin ids to get name to display
      // get list of unique data partner and admin ids
      const adminObject = {};
      datasets.map((dataset) => {
        adminObject[dataset.admin] = true;
        const created_at = {};
        created_at.created_at = dataset.created_at;
        created_at.displayString = moment(dataset.created_at.toString()).format(
          "MMM. DD, YYYY, h:mm a",
        );
        dataset.created_at = created_at;
      });

      data.current = datasets;
      activeDatasets.current = datasets.filter(
        (dataset) => dataset.hidden == false,
      );
      archivedDatasets.current = datasets.filter(
        (dataset) => dataset.hidden == true,
      );
      active.current
        ? setDisplayedData(activeDatasets.current)
        : setDisplayedData(archivedDatasets.current);
      active.current
        ? setTitle("Active Datasets")
        : setTitle("Archived Datasets");
      setLoadingMessage(null);
    }
  }, [currentPage, page_size, firstLoad]);

  const onPageChange = (page) => {
    if (active.current == false) {
      window.history.pushState(
        {},
        "",
        `/datasets/?filter=archived&p=${page}&page_size=${page_size}`,
      );
    } else {
      window.history.pushState(
        {},
        "",
        `/datasets/?p=${page}&page_size=${page_size}`,
      );
    }
    setCurrentPage(page);
  };

  const activateOrArchiveDataset = async (id, theIndicator) => {
    try {
      setDisplayedData((currentData) =>
        currentData.map((dataset) =>
          dataset.id == id ? { ...dataset, loading: true } : dataset,
        ),
      );
      const patchData = { hidden: theIndicator };
      const res = await usePatch(`/datasets/update/${id}/`, patchData);
      data.current = data.current.map((dataset) =>
        dataset.id == id ? { ...dataset, hidden: theIndicator } : dataset,
      );
      activeDatasets.current = data.current.filter(
        (dataset) => dataset.hidden == false,
      );
      archivedDatasets.current = data.current.filter(
        (dataset) => dataset.hidden == true,
      );
      active.current
        ? setDisplayedData(activeDatasets.current)
        : setDisplayedData(archivedDatasets.current);
    } catch (err) {
      setAlert({
        status: "error",
        title: "Unable to archive dataset " + id,
        description: "",
      });
      onOpen();
      setDisplayedData((currentData) =>
        currentData.map((scanreport) =>
          scanreport.id == id ? { ...scanreport, loading: false } : scanreport,
        ),
      );
    }
  };

  // show active datasets and change url when 'Active Datasets' button is pressed
  const goToActive = () => {
    if (active.current == false) {
      active.current = true;
      setDisplayedData(activeDatasets.current);
      window.history.pushState(
        {},
        "",
        `/datasets/?p=${currentPage}&page_size=${page_size}`,
      );
      setTitle("Active Datasets");
    }
  };

  // show archived datasets and change url when 'Archived Datasets' button is pressed
  const goToArchived = () => {
    if (active.current == true) {
      active.current = false;
      setDisplayedData(archivedDatasets.current);
      window.history.pushState(
        {},
        "",
        `/datasets/?filter=archived&p=${currentPage}&page_size=${page_size}`,
      );
      setTitle("Archived Datasets");
    }
  };

  const applyFilters = (variable) => {
    let newData = variable.map((dataset) => dataset);

    if (datapartnerFilter !== "All") {
      newData = newData.filter(
        (dataset) => dataset.data_partner.name === datapartnerFilter,
      );
    }
    return newData;
  };

  const removeFilter = (a, b) => {
    if (a.includes("Data Partner")) {
      setDataPartnerFilter("All");
    }
  };

  if (loadingMessage) {
    //Render Loading State
    return (
      <div>
        <Flex padding="30px">
          <Spinner />
          <Flex marginLeft="10px">{loadingMessage}</Flex>
        </Flex>
      </div>
    );
  }

  return (
    <div>
      <CCBreadcrumbBar>
        <Link href={"/"}>Home</Link>
        <Link href={"/datasets/"}>Datasets</Link>
      </CCBreadcrumbBar>
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
      <Flex>
        <PageHeading text={title} />
        <Spacer />
        <Button
          disabled={title === "Active Datasets"}
          variant="blue"
          mr="10px"
          onClick={goToActive}
        >
          Active Datasets
        </Button>
        <Button
          disabled={title === "Archived Datasets"}
          variant="blue"
          onClick={goToArchived}
        >
          Archived Datasets
        </Button>
      </Flex>
      <Center>
        <Pagination
          activePage={currentPage}
          itemsCountPerPage={page_size}
          totalItemsCount={totalItemsCount}
          pageRangeDisplayed={5}
          onChange={onPageChange}
          itemClass="btn paginate-inactive"
          activeClass="btn paginate-active"
        />
      </Center>
      <HStack>
        <Text style={{ fontWeight: "bold" }}>Applied Filters: </Text>
        {[{ title: "Data Partner -", filter: datapartnerFilter }].map(
          (filter) => {
            if (filter.filter === "All") {
              return null;
            } else {
              return (
                <ConceptTag
                  key={filter.title}
                  conceptName={filter.filter}
                  conceptId={filter.title}
                  conceptIdentifier={filter.title}
                  itemId={filter.title}
                  handleDelete={removeFilter}
                />
              );
            }
          },
        )}
      </HStack>
      <Table w="100%" variant="striped" colorScheme="greyBasic">
        <TableCaption></TableCaption>
        <Thead>
          <Tr className={"mediumTbl"}>
            <Th style={{ fontSize: "16px" }}>ID</Th>
            <Th>Name</Th>
            <Select
              minW="130px"
              style={{ fontWeight: "bold" }}
              variant="unstyled"
              value="Data Partner"
              readOnly
              onChange={(option) => setDataPartnerFilter(option.target.value)}
            >
              <option style={{ fontWeight: "bold" }} disabled>
                Data Partner
              </option>
              <>
                {[
                  ...[
                    ...new Set(
                      displayedData.map((data) => data.data_partner.name),
                    ),
                  ],
                ]
                  .sort((a, b) => a.localeCompare(b))
                  .map((item, index) => (
                    <option key={index} value={item}>
                      {item}
                    </option>
                  ))}
              </>
            </Select>
            <Th>Visibility</Th>
            <Th>Creation Date</Th>
            <Th></Th>
            <Th>Archive</Th>
          </Tr>
        </Thead>
        <Tbody>
          {applyFilters(displayedData).length > 0 &&
            applyFilters(displayedData).map((item, index) => (
              <Tr className={"mediumTbl"} key={index}>
                <Td maxW={"100px"}>
                  <Link
                    style={{ color: "#0000FF" }}
                    href={`/datasets/${item.id}/`}
                  >
                    {item.id}
                  </Link>
                </Td>
                <Td maxW={"100px"}>
                  <Link
                    style={{ color: "#0000FF" }}
                    href={`/datasets/${item.id}/`}
                  >
                    {" "}
                    {item.name}
                  </Link>
                </Td>
                <Td maxW={"100px"}> {item.data_partner.name} </Td>
                <Td maxW={"100px"}> {item.visibility} </Td>
                <Td maxW={"200px"} minW={"180px"}>
                  {item.created_at.displayString}
                </Td>
                <Td maxW={"100px"}>
                  <Link href={`/datasets/${item.id}/details/`}>
                    <Button variant="blue" my="10px">
                      Details
                    </Button>
                  </Link>
                </Td>
                <Td textAlign="center">
                  {item.hidden ? (
                    <>
                      {item.loading ? (
                        <Spinner />
                      ) : (
                        <ViewOffIcon
                          _hover={{ color: "blue" }}
                          onClick={() =>
                            activateOrArchiveDataset(item.id, false)
                          }
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {item.loading ? (
                        <Spinner />
                      ) : (
                        <ViewIcon
                          _hover={{ color: "blue" }}
                          onClick={() =>
                            activateOrArchiveDataset(item.id, true)
                          }
                        />
                      )}
                    </>
                  )}
                </Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
      {applyFilters(displayedData).length == 0 && (
        <Flex marginLeft="10px">No Datasets available</Flex>
      )}
    </div>
  );
};

export default DatasetTbl;
