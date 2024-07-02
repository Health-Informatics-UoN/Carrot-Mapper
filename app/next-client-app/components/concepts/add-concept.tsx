import {
  addConcept,
  getAllConceptsFiltered,
  getAllScanReportConcepts,
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
}: AddConceptProps) {
  const handleSubmit = async (conceptCode: number) => {
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
        const newConcepts = await getAllScanReportConcepts(
          `object_id=${rowId}`,
        );
        const filteredConcepts = await getAllConceptsFiltered(
          newConcepts?.map((item) => item.concept).join(","),
        );
        // Filter the concept and concept filter
        const newConcept = newConcepts.filter(
          (c) => c.concept == conceptCode,
        )[0];
        const filteredConcept = filteredConcepts.filter(
          (c) => c.concept_id == conceptCode,
        )[0];

        addSR(newConcept, filteredConcept);
        toast.success(`OMOP Concept successfully added.`);
      }
    } catch (error) {
      toast.error(`Adding concept failed. Error: Unknown error`);
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
