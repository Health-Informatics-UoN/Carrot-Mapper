import {
  getContentType,
  getOmopField,
  getOmopTable,
  getOmopTableCheck,
  getScanReportTable,
  postConcept,
  validateConceptCode,
} from "@/api/scanreports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import { mapConceptToOmopField } from "@/lib/concept-utils";
import { Form, Formik } from "formik";
import { toast } from "sonner";
import { objToQuery } from "@/lib/client-utils";

const m_allowed_tables = [
  "person",
  "measurement",
  "condition_occurrence",
  "observation",
  "drug_exposure",
  "procedure_occurrence",
  "specimen",
];

export default function AddConcept({
  tableId,
  source_field,
}: {
  tableId: string;
  source_field: number;
}) {
  const defaultParams = {
    type_name: "scanreportfield",
  };
  const params = { ...defaultParams };
  const query = objToQuery(params);

  const handleSubmit = async (conceptCode: number) => {
    try {
      const concept = await validateConceptCode(conceptCode);
      const domain = concept?.domain_id.toLowerCase();
      const table = await getScanReportTable(tableId);
      const fields = await getOmopField();
      const destination_field: OmopField = await mapConceptToOmopField(
        table,
        fields,
        domain,
        domain + "_source_concept_id"
      );
      const contentType = await getContentType(query);
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
      } else {
        // check if concept exists
        if (!concept.concept_id) {
          toast.error("No concept matches this concept code!");
          // check if concept has valid destination field
          if (!destination_field) {
            toast.error("Could not find a destination field for this concept");
          }
          // check if concepts omop table has been implemented
          let omopTableCheck = await getOmopTableCheck(destination_field.table);
          if (!m_allowed_tables.includes(omopTableCheck.table)) {
            toast.error("Have not yet implemented concept");
          }
        }
      }

      const data = {
        concept: concept.concept_id,
        object_id: source_field,
        content_type: contentType.content_type_id,
        creation_type: "M",
      };

      const response = await postConcept(JSON.stringify(data));
      console.log(response); // return the empty object/value = 0
      // if concept does not exist, display error
    } catch (error) {
      const errorObj = JSON.parse((error as ApiError).message);
      toast.error(`Adding concept failed! Error: ${errorObj.detail}`);
      console.error(error);
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
            <div className="flex-none">
              <Input
                type="number"
                name="concept"
                value={values.concept}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit">Add</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
