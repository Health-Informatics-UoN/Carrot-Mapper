import React, { useState, useEffect } from "react";
import { Flex, Link, Grid, Text, GridItem } from "@chakra-ui/react";
import { getContentTypeId } from "../api/values";
const truncate = (str) => {
  return str.length > 20 ? str.substring(0, 20) + "..." : str;
};
function AnalysisTbl({ data }) {
  const [contentTypeId, setContentTypeId] = useState(null);

  useEffect(() => {
    const fetchContentTypeId = async () => {
      const { content_type_id } = await getContentTypeId("scanreportfield");
      setContentTypeId(content_type_id);
    };

    fetchContentTypeId();
  }, []);

  if (!contentTypeId) {
    return <div>Loading...</div>;
  }

  return (
    <Grid templateColumns="repeat(4, 1fr)" gap={6}>
      <Text fontWeight={"bold"}>Concept ID</Text>
      <Text fontWeight={"bold"}>
        <span style={{ color: "#475da7" }}>Ancestors</span> /
        <span style={{ color: "#3db28c" }}> Descendants</span>
      </Text>
      <Text
        fontWeight={"bold"}
        textAlignVertical={"center"}
        textAlign={"center"}
      >
        Min/Max Separation
      </Text>
      <Text fontWeight={"bold"}>Source</Text>

      {data.length > 0 ? (
        data.map((item, index) => (
          <GridItem
            colSpan={4}
            w={"100%"}
            bg={index % 2 == 0 ? "greyBasic.100" : "greyBasic.500"}
          >
            <Grid templateColumns="repeat(4, 1fr)">
              <Text>
                {item.rule_id} - {item.rule_name}
              </Text>
              <GridItem colSpan={3}>
                {item.anc_desc.map((element) => (
                  <Grid templateColumns="repeat(3, 1fr)">
                    {element.ancestors.map((ancestor) => (
                      <>
                        <Text style={{ color: "#475da7" }}>
                          {" "}
                          {ancestor.a_id} - {ancestor.a_name} (A)
                        </Text>
                        <Text
                          style={{
                            color: "#475da7",
                            textAlignVertical: "center",
                            textAlign: "center",
                          }}
                        >
                          {" "}
                          {ancestor.level}{" "}
                        </Text>
                        <div style={{ alignSelf: "flex-start" }}>
                          {ancestor.source.map((source_id) => {
                            if (
                              source_id.concept__content_type == contentTypeId
                            )
                              return (
                                <Text
                                  maxWidth={"200px"}
                                  title={source_id.source_field__name}
                                  sx={{ m: 1 }}
                                >
                                  <Link
                                    style={{ color: "#0000FF" }}
                                    href={`/scanreports/${source_id.source_field__scan_report_table__scan_report}/tables/${source_id.source_field__scan_report_table__id}/`}
                                  >
                                    {" "}
                                    {truncate(
                                      source_id.source_field__name,
                                    )}{" "}
                                  </Link>{" "}
                                </Text>
                              );
                            return (
                              <Text
                                maxWidth={"200px"}
                                title={source_id.source_field__name}
                                sx={{ m: 1 }}
                              >
                                {" "}
                                <Link
                                  style={{ color: "#0000FF" }}
                                  href={`/scanreports/${source_id.source_field__scan_report_table__scan_report}/tables/${source_id.source_field__scan_report_table__id}/fields/${source_id.source_field__id}/`}
                                >
                                  {" "}
                                  {truncate(source_id.source_field__name)}{" "}
                                </Link>
                              </Text>
                            );
                          })}
                        </div>
                      </>
                    ))}

                    {element.descendants.map((descendant) => (
                      <>
                        <Text style={{ color: "#3db28c" }}>
                          {" "}
                          {descendant.d_id} - {descendant.d_name} (D)
                        </Text>
                        <div
                          style={{
                            color: "#3db28c",
                            textAlignVertical: "center",
                            textAlign: "center",
                          }}
                        >
                          {" "}
                          {descendant.level}
                        </div>
                        <div style={{ alignSelf: "flex-start" }}>
                          {descendant.source.map((source_id) => {
                            if (
                              source_id.concept__content_type == contentTypeId
                            )
                              return (
                                <Text
                                  maxWidth={"200px"}
                                  title={source_id.source_field__name}
                                  sx={{ m: 1 }}
                                >
                                  <Link
                                    style={{ color: "#0000FF" }}
                                    href={`/scanreports/${source_id.source_field__scan_report_table__scan_report}/tables/${source_id.source_field__scan_report_table__id}/`}
                                  >
                                    {" "}
                                    {source_id.source_field__name}{" "}
                                  </Link>
                                </Text>
                              );
                            return (
                              <Text
                                maxWidth={"200px"}
                                title={source_id.source_field__name}
                                sx={{ m: 1 }}
                              >
                                <Link
                                  style={{ color: "#0000FF" }}
                                  href={`/scanreports/${source_id.source_field__scan_report_table__scan_report}/tables/${source_id.source_field__scan_report_table__id}/fields/${source_id.source_field__id}/`}
                                >
                                  {" "}
                                  {source_id.source_field__name}{" "}
                                </Link>
                              </Text>
                            );
                          })}
                        </div>
                      </>
                    ))}
                  </Grid>
                ))}
              </GridItem>
            </Grid>
          </GridItem>
        ))
      ) : (
        <Flex padding="30px">
          <Flex marginLeft="10px">
            No ancestors or descendants of these mappings appear in any other
            Scan Reports
          </Flex>
        </Flex>
      )}
    </Grid>
  );
}

export default AnalysisTbl;
