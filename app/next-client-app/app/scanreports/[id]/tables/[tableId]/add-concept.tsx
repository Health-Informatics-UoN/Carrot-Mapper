import {
  getConcept,
  getConceptFilters,
  getContentTypeId,
  addConcept,
  getScanReportConcepts,
} from "@/api/concepts";
import { getOmopFields, getOmopTable } from "@/api/omop";
import { getScanReportTable } from "@/api/scanreports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { m_allowed_tables } from "@/constants/concepts";
import { ApiError } from "@/lib/api/error";
import { mapConceptToOmopField, saveMappingRules } from "@/lib/concept-utils";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { objToQuery } from "@/lib/client-utils";

interface AddConceptProps {
  id: number;
  tableId: string;
}

export default function AddConcept({ id, tableId }: AddConceptProps) {
  const TypeNameParam = {
    type_name: "scanreportfield",
  };
  const typeNameQuery = objToQuery(TypeNameParam);
  const ObjectParam = {
    object_id: id,
  };
  const objectQuery = objToQuery(ObjectParam);

  const handleError = (error: any, message: string) => {
    const errorObj = JSON.parse((error as ApiError).message);
    toast.error(`${message} Error: ${errorObj.detail}`);
    console.error(error);
  };

  const handleSubmit = async (conceptCode: number) => {
    try {
      const table = await getScanReportTable(tableId);
      const concept = await getConcept(conceptCode);
      const domain = concept?.domain_id.toLocaleLowerCase() ?? "";
      const fields = await getOmopFields();
      const contentType = await getContentTypeId(typeNameQuery);
      // set the error message depending on which value is missing
      if (!table.person_id || !table.date_event) {
        let message;
        if (!table.person_id && !table.date_event) {
          message = "Please set the person_id and a date_event on the table ";
        } else if (!table.person_id) {
          message = "Please set the person_id on the table ";
        } else {
          message = "Please set the date_event on the table ";
        }
        toast.error(message);
        return;
      }

      // check if concept exists
      if (!concept.concept_id) {
        toast.error(
          `Concept id ${conceptCode} does not exist in our database.`,
        );
        return;
      }

      // check if concept has valid destination field
      const cachedOmopFunction = mapConceptToOmopField();
      const destination_field = await cachedOmopFunction(
        fields,
        domain + "_source_concept_id",
      );
      if (!destination_field) {
        toast.error("Could not find a destination field for this concept");
        return;
      }

      // check concepts omop table has been implemented
      const omopTable = await getOmopTable(destination_field.table.toString());
      if (!m_allowed_tables.includes(omopTable.table)) {
        toast.error(
          `Concept ${concept.concept_id} (${concept.concept_name}) is from table '${omopTable.table}' which is not implemented yet.`,
        );
        return;
      }

      try {
        // Make sure that the code input is not overlap
        let scanreportconceptCheck = await getScanReportConcepts(objectQuery);
        if (
          scanreportconceptCheck.find((item) => item.concept === conceptCode)
        ) {
          toast.error(
            "Can't add multiple concepts of the same id to the same object",
          );
          return;
        }
        // create scan report concept
        await addConcept({
          concept: conceptCode,
          object_id: id,
          content_type: "scanreportfield",
          creation_type: "M",
        });
        let scanreportconcepts = await getScanReportConcepts(objectQuery);
        if (scanreportconcepts.length > 0) {
          const conceptIds = scanreportconcepts.map((value) => value.concept);
          const conceptFilters = await getConceptFilters(conceptIds.join());

          // save new concepts to state
          const scanreport_concepts = scanreportconcepts.map((element) => ({
            ...element,
            concept: conceptFilters.find(
              (con) => con.concept_id == element.concept,
            ),
          }));
          toast.success("ConceptId linked to the value");

          // create mapping rules for new concept
          const scan_report_concept = scanreport_concepts.filter(
            (con) => con.concept?.concept_id == conceptCode,
          )[0];
          try {
            await saveMappingRules(scan_report_concept as any, table);
            toast.success("Mapping Rules created");
          } catch (error) {
            handleError(error, "Could not create mapping rules");
          }
        } else {
          toast.error("Could not find the concepts");
        }
      } catch (error) {
        handleError(error, "Unable to link Concept id to value");
      }
    } catch (error) {
      handleError(error, "Adding concept failed!");
    }
  };

  return (
    <Formik
      initialValues={{ concept: "" }}
      onSubmit={(data, actions) => {
        handleSubmit(Number(data.concept));
        actions.resetForm();
      }}
    >
      {({ values, handleChange, handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div>
              <Input
                type="number"
                name="concept"
                value={values.concept}
                onChange={handleChange}
                required
                className="w-[180px]"
              />
            </div>
            <Button type="submit">Add</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
