"use client";

import { Button } from "@/components/ui/button";
import { updateScanReportTable } from "@/api/scanreports";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { FormDataFilter } from "../form-components/FormikUtils";
import { Form, Formik } from "formik";
import { Tooltips } from "../Tooltips";
import { FormikSelect } from "../form-components/FormikSelect";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

interface FormData {
  personId: number | null;
  dateEvent: number | null;
  death_table: boolean;
}

export function ScanReportTableUpdateForm({
  scanreportFields,
  scanreportTable,
  permissions,
  personId,
  dateEvent,
}: {
  scanreportFields: ScanReportField[];
  scanreportTable: ScanReportTable;
  permissions: Permission[];
  personId: ScanReportField;
  dateEvent: ScanReportField;
}) {
  const canUpdate =
    permissions.includes("CanEdit") || permissions.includes("CanAdmin");

  const fieldOptions = FormDataFilter<ScanReportField>(scanreportFields);

  const initialPersonId = FormDataFilter<ScanReportField>(personId);
  const initialDateEvent = FormDataFilter<ScanReportField>(dateEvent);

  const handleSubmit = async (data: FormData) => {
    const submittingData = {
      person_id: data.personId !== 0 ? data.personId : null,
      date_event: data.dateEvent !== 0 ? data.dateEvent : null,
      death_table: data.death_table,
    };

    const response = await updateScanReportTable(
      scanreportTable.scan_report,
      scanreportTable.id,
      submittingData
    );
    if (response) {
      toast.error(
        `Update Scan Report Table failed. Error: ${response.errorMessage}`
      );
    } else {
      toast.success("Update Scan Report Table successful!");
    }
  };

  return (
    <Formik
      initialValues={{
        dateEvent: initialDateEvent[0].value,
        personId: initialPersonId[0].value,
        death_table: scanreportTable.death_table,
      }}
      onSubmit={(data) => {
        handleSubmit(data);
      }}
    >
      {({ handleSubmit, handleChange, values }) => (
        <Form className="w-full" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 text-lg">
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                Person ID{" "}
                <Tooltips
                  content="Every CDM object must contain at least one person ID."
                  link="https://carrot4omop.ac.uk/Carrot-Mapper/mapping-rules/#1-person-id"
                />
              </h3>
              <FormikSelect
                options={fieldOptions}
                name="personId"
                placeholder="Choose a Person ID"
                isMulti={false}
                isDisabled={!canUpdate}
              />
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="flex">
                {" "}
                Date Event
                <Tooltips
                  content="Every CDM object must contain at least one date_event."
                  link="https://carrot4omop.ac.uk/Carrot-Mapper/mapping-rules/#2-date-events"
                />
              </h3>
              <FormikSelect
                options={fieldOptions}
                name="dateEvent"
                placeholder="Choose a Date Event"
                isMulti={false}
                isDisabled={!canUpdate}
              />
            </div>
            {/* Should this only to be turn on/off when Person ID and date event is filled? because change here will also trigger re-use and omop building functions*/}
            {/* Should this only turned on once? because mapping when "on" will be different than "off", after being "on" */}
            {/* On should be always on, and off should be always off */}
            {/* Because this setting will permanent, should have an dialog warning about turning on this setting will be permanent */}
            {/* give more support/info and notice in tooltips */}

            <div className="flex gap-2">
              <h3 className="flex">
                {" "}
                Is this a Death table?
                <Tooltips content="If this is set to YES, concepts added here with domains RACE, ETHNICITY and GENDER will be mapped to PERSON table. ALL of other concepts added here will be mapped to DEATH table" />
              </h3>
              <Switch
                onCheckedChange={(checked) => {
                  handleChange({
                    target: {
                      name: "death_table",
                      value: checked ? true : false,
                    },
                  });
                }}
                checked={values.death_table}
              />
              <Label className="text-lg">
                {values.death_table === true ? "YES" : "NO"}
              </Label>
            </div>

            <div className="flex mt-3">
              <Button
                type="submit"
                className="px-4 py-2 bg-carrot text-white rounded text-lg"
                disabled={!canUpdate}
              >
                Save <Save className="ml-2" />
              </Button>
              <Tooltips
                content="You must be the author of the scan report or an admin of the parent dataset
                    to update the details of this scan report table."
              />
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
