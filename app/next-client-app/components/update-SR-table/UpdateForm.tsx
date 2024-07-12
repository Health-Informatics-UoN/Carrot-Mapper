"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PersonID } from "./PersonID";
import { DateEvent } from "./DateEvent";
import { getScanReportField, updateScanReportTable } from "@/api/scanreports";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/error";
import { FormDataFilter } from "../form-components/FormikUtils";
import { Form, Formik } from "formik";
import { Tooltips } from "../Tooltips";
import { FormikSelect } from "../form-components/FormikSelect";

interface FormData {
  personId: number | null;
  dateEvent: number | null;
}

export function UpdateForm({
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

  // Making options suitable for React Select
  // Initialize with default values

  const fieldOptions = FormDataFilter<ScanReportField>(scanreportFields);

  const initialPersonId = FormDataFilter<ScanReportField>(personId);
  const initialDateEvent = FormDataFilter<ScanReportField>(dateEvent);

  const handleSubmit = async (data: FormData) => {
    const submittingData = {
      person_id: data.personId !== 0 ? data.personId : null,
      date_event: data.dateEvent !== 0 ? data.dateEvent : null,
    };

    const response = await updateScanReportTable(
      scanreportTable.id,
      submittingData,
      scanreportTable.scan_report
    );
    if (response) {
      toast.error(`Update Scan Report failed. Error: ${response.errorMessage}`);
    } else {
      toast.success("Update Scan Report successful!");
    }
  };

  return (
    <Formik
      initialValues={{
        dateEvent: initialDateEvent[0].value,
        personId: initialPersonId[0].value,
      }}
      onSubmit={(data) => {
        handleSubmit(data);
      }}
    >
      {({ handleSubmit }) => (
        <Form className="w-full" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 text-lg">
            <div className="flex flex-col gap-2">
              <h3 className="flex">
                Person ID{" "}
                <Tooltips
                  content="Authors of a Scan Report can edit Scan Report details."
                  link="https://carrot4omop.ac.uk/Carrot-Mapper/projects-datasets-and-scanreports/#authors"
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
                  content="Viewers of a Scan Report can perform read-only actions."
                  link="https://carrot4omop.ac.uk/Carrot-Mapper/projects-datasets-and-scanreports/#viewers"
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

            <div className="flex">
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
