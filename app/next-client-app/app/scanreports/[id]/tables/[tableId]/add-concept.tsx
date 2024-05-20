import {
  getConcept,
  getConceptFilters,
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
  const objectQuery = objToQuery({
    object_id: id,
  });

  const handleError = (error: any, message: string) => {
    const errorObj = JSON.parse((error as ApiError).message);
    toast.error(`${message} Error: ${errorObj.detail}`);
    console.error(error);
  };

  const handleSubmit = async (conceptCode: number) => {
    try {
      // create scan report concept
      await addConcept({
        concept: conceptCode,
        object_id: id,
        content_type: "scanreportfield",
        creation_type: "M",
        table_id: tableId,
      });
      toast.success("ConceptId linked to the value");

      // let scanreportconcepts = await getScanReportConcepts(objectQuery);
      // if (scanreportconcepts.length > 0) {
      // if (false) {
      //   const conceptIds = scanreportconcepts.map((value) => value.concept);
      //   const conceptFilters = await getConceptFilters(conceptIds.join());

      //   // save new concepts to state
      //   const scanreport_concepts = scanreportconcepts.map((element) => ({
      //     ...element,
      //     concept: conceptFilters.find(
      //       (con) => con.concept_id == element.concept
      //     ),
      //   }));

      //   // create mapping rules for new concept
      //   const scan_report_concept = scanreport_concepts.filter(
      //     (con) => con.concept?.concept_id == conceptCode
      //   )[0];
      //   try {
      //     await saveMappingRules(
      //       scan_report_concept as any,
      //       table,
      //       destination_field
      //     );
      //     toast.success("Mapping Rules created");
      //   } catch (error) {
      //     handleError(error, "Could not create mapping rules");
      //   }
      // } else {
      //   toast.error("Could not find the concepts");
      // }
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
