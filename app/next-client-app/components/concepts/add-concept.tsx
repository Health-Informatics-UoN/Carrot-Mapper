import {
  addConcept,
  getConceptFilters,
  getScanReportConcepts,
} from "@/api/concepts";
import { getScanReportField } from "@/api/scanreports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, Formik } from "formik";
import { toast } from "sonner";

interface AddConceptProps {
  rowId: number;
  parentId: string;
  location: string;
  disabled: boolean;
  addSR: (concept: ScanReportConcept, c: Concept) => void;
}

export default function AddConcept({
  rowId,
  parentId,
  location,
  disabled,
  addSR,
  // loading,
  // setLoading,
}: AddConceptProps) {
  const handleSubmit = async (conceptCode: number) => {
    // setLoading(true);
    try {
      const determineContentType = (location: string) => {
        return location === "SR-Values" ? "scanreportvalue" : "scanreportfield";
      };

      const determineTableId = async (location: string, parentId: string) => {
        if (location === "SR-Values") {
          const field = await getScanReportField(parentId);
          return field?.scan_report_table;
        }
        return parentId;
      };
      const response = await addConcept({
        concept: conceptCode,
        object_id: rowId,
        content_type: determineContentType(location),
        creation_type: "M",
        table_id: await determineTableId(location, parentId),
      });

      if (response) {
        toast.error(`Adding concept failed. ${response.errorMessage}`);
      } else {
        const updatedConcepts = await getScanReportConcepts(
          `object_id=${rowId}`,
        );
        const updatedConceptsFiltered =
          updatedConcepts.length > 0
            ? await getConceptFilters(
                updatedConcepts?.map((item) => item.concept).join(","),
              )
            : [];

        addSR(updatedConcepts[0], updatedConceptsFiltered[0]);
        toast.success(`OMOP Concept successfully added.`);
      }
    } catch (error) {
      toast.error(`Adding concept failed. Error: Unknown error`);
    } finally {
      // setLoading(false);
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
                type="text"
                name="concept"
                value={values.concept}
                onChange={handleChange}
                required
                className="w-[180px]"
                pattern="\d*"
              />
            </div>
            <Button type="submit" disabled={disabled}>
              Add
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
