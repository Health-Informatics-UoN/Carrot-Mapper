import {
  getOmopField,
  getOmopTable,
  getScanReportTable,
  validateConceptCode,
} from "@/api/scanreports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import { Form, Formik } from "formik";
import { toast } from "sonner";

export default function AddConcept({ tableId }: { tableId: string }) {
  const handleSubmit = async (conceptCode: number) => {
    try {
      const concept = await validateConceptCode(conceptCode);
      const domain = concept?.domain_id.toLocaleLowerCase();
      const table = await getScanReportTable(tableId);
      const fields = await getOmopField();
      // check if concept exists
      if (concept.concept_id) {
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
        }
      }
      // if concept does not exist, display error
      toast.error("No concept matches this concept code!");
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
