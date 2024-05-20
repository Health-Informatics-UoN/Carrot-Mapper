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
      await addConcept({
        concept: conceptCode,
        object_id: id,
        content_type: "scanreportfield",
        creation_type: "M",
        table_id: tableId,
      });
      toast.success("ConceptId linked to the value");
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
