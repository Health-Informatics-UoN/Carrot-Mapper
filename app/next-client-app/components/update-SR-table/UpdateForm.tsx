"use client";

import {
  getDataPartners,
  getDataUsers,
  getDatasetProject,
  getProjects,
} from "@/api/datasets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PersonID } from "./PersonID";
import { DateEvent } from "./DateEvent";
import { getScanReportField } from "@/api/scanreports";
import { Save } from "lucide-react";

export interface ShortFields {
  id: number | string | null;
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
          id: scanreportTable.person_id,
          name: personId.name,
        });
        setDateEvent({
          id: scanreportTable.date_event,
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log(selectedDateEvent?.id);
    console.log(selectedPersonID?.id);
  };

  return (
    <form onSubmit={handleSubmit}>
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
    </form>
  );
}
