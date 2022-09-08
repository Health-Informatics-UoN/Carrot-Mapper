import React from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  VStack,
  Flex,
  Link,
  Select,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import ConceptTag from "./ConceptTag";
function RulesTbl({
  values,
  filters,
  removeFilter,
  setDestinationFilter,
  setSourceFilter,
  destinationTableFilter,
  sourceTableFilter,
  applyFilters,
  scanReportId,
}) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ fontWeight: "bold", marginRight: "10px" }}>Filters: </div>
        {filters.map((filter, index) => {
          return (
            <div style={{ marginTop: "10px" }}>
              <ConceptTag
                key={index}
                conceptName={filter.name}
                conceptId={filter.title}
                conceptIdentifier={filter.name}
                itemId={filter.title}
                handleDelete={removeFilter}
              />
            </div>
          );
        })}
      </div>
      <Table colorScheme="greyBasic">
        <TableCaption></TableCaption>
        <Thead>
          <Tr>
            <Th>Rule ID</Th>
            <Th>
              <Select
                minW="130px"
                style={{ fontWeight: "bold" }}
                variant="unstyled"
                value="Destination Table"
                readOnly
                onChange={(option) => setDestinationFilter(option.target.value)}
              >
                <option style={{ fontWeight: "bold" }} disabled>
                  Destination Table
                </option>
                <>
                  {[
                    ...[
                      ...new Set(
                        values.map((data) => data.destination_table.name),
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
            </Th>
            <Th>Destination Field</Th>
            <Th>
              <Select
                minW="130px"
                style={{ fontWeight: "bold" }}
                variant="unstyled"
                value="Source Table"
                readOnly
                onChange={(option) => setSourceFilter(option.target.value)}
              >
                <option style={{ fontWeight: "bold" }} disabled>
                  Source Table
                </option>
                <>
                  {[
                    ...[
                      ...new Set(values.map((data) => data.source_table.name)),
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
            </Th>
            <Th>Source Field</Th>
            <Th>Term Map</Th>
            <Th>Creation Type</Th>
          </Tr>
        </Thead>
        <Tbody>
          {applyFilters(values).length > 0 ? (
            // Create new row for every value object
            applyFilters(values).map((item, index) => (
              <Tr key={index} bg={item.flag ? "lightred" : ""}>
                <Td maxW={[50, 100, 200]}>{item.rule_id} </Td>
                <Td maxW={[50, 100, 200]}>{item.destination_table.name} </Td>
                <Td maxW={[50, 100, 200]}>{item.destination_field.name}</Td>
                <Td maxW={[50, 100, 200]}>
                  <Link
                    style={{ color: "#0000FF" }}
                    href={`/scanreports/${scanReportId}/tables/${item.source_table.id}/`}
                  >
                    {item.source_table.name}
                  </Link>
                </Td>
                <Td maxW={[50, 100, 200]}>
                  <Link
                    style={{ color: "#0000FF" }}
                    href={`/scanreports/${scanReportId}/tables/${item.source_table.id}/fields/${item.source_field.id}/`}
                  >
                    {item.source_field.name}
                  </Link>
                </Td>
                <Td maxW={[50, 100, 200]}>
                  {item.term_mapping != null && (
                    <>
                      {typeof item.term_mapping == "object" ? (
                        <VStack>
                          <div>
                            <span style={{ color: "#dd5064" }}>
                              "{Object.keys(item.term_mapping)[0]}"
                            </span>
                            <ArrowForwardIcon />
                            <span style={{ color: "#1d8459" }}>
                              {item.term_mapping[
                                Object.keys(item.term_mapping)[0]
                              ] + " "}
                              {item.rule_name}
                            </span>
                          </div>
                        </VStack>
                      ) : (
                        <div>
                          {JSON.stringify(item.term_mapping)} {item.rule_name}
                        </div>
                      )}
                    </>
                  )}
                </Td>
                <Td maxW={[50, 100, 200]}>{item.creation_type}</Td>
              </Tr>
            ))
          ) : (
            <Flex padding="30px">
              <Flex marginLeft="10px">Nothing</Flex>
            </Flex>
          )}
        </Tbody>
      </Table>
    </div>
  );
}

export default RulesTbl;
