"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PersonID } from "./PersonID";
import { DateEvent } from "./DateEvent";
import { getScanReportField, updateScanReportTable } from "@/api/scanreports";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/error";
import { Form, Formik } from "formik";

export interface ShortFields {
  id: number | null;
  name: string | null;
}

export function UpdateForm({
  scanreportFields,
  scanreportTable,
}: {
  scanreportFields: ShortFields[];
  scanreportTable: ScanReportTable;
}) {
  const [selectedPersonID, setPersonID] = useState<ShortFields>();
  const [selectedDateEvent, setDateEvent] = useState<ShortFields>();

  useEffect(() => {
    const setInitialValues = async () => {
      try {
        const personId = await getScanReportField(scanreportTable.person_id);
        const dateEvent = await getScanReportField(scanreportTable.date_event);
        setPersonID({
          id: parseInt(scanreportTable.person_id),
          name: personId.name,
        });
        setDateEvent({
          id: parseInt(scanreportTable.date_event),
          name: dateEvent.name,
        });
      } catch (error) {
        console.error(error);
      }
    };
    setInitialValues();
  }, []);

  const handleSelectPersonID = (option: ShortFields) => {
    setPersonID(option);
  };
  const handleSelectDateEvent = (option: ShortFields) => {
    setDateEvent(option);
  };

  const handleError = (error: any, message: string) => {
    if (error instanceof ApiError) {
      try {
        const errorObj = JSON.parse(error.message);
        toast.error(`${message} Error: ${errorObj.detail}`);
      } catch {
        toast.error(`${message} Error: ${error.message}`);
      }
    } else {
      toast.error(
        `${message} Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
    console.error(error);
  };

  const handleSubmit = async () => {
    try {
      await updateScanReportTable(
        scanreportTable.id,
        "person_id",
        selectedPersonID?.id || null,
        "date_event",
        selectedDateEvent?.id || null
      );
      toast.success(`Update table succeeded.`);
    } catch (error) {
      handleError(error, "Update table failed");
    }
  };

  return (
    <Formik
      initialValues={{}}
      onSubmit={() => {
        handleSubmit();
      }}
    >
      {({ handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row mt-5 gap-3">
            <div>
              <PersonID
                title="Person ID"
                options={scanreportFields}
                selectedOption={selectedPersonID}
                handleSelect={handleSelectPersonID}
              />
            </div>
            <div>
              <DateEvent
                title="Date Event"
                options={scanreportFields}
                selectedOption={selectedDateEvent}
                handleSelect={handleSelectDateEvent}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="mt-4 px-4 py-2 bg-carrot text-white text-lg rounded"
          >
            Save <Save className="ml-2" />
          </Button>
        </Form>
      )}
    </Formik>
  );
}
