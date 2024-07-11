"use client";

import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Form, Formik } from "formik";
import { Tooltips } from "../Tooltips";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { updateScanReportField } from "@/api/scanreports";
import { toast } from "sonner";

interface FormData {
  description: string | null;
  isIgnore: boolean;
  fromSource: boolean;
}

export function ScanReportFieldEditForm({
  scanReportField,
  permissions,
  scanreportId,
}: {
  scanReportField: ScanReportField | null;
  permissions: Permission[];
  scanreportId: number;
}) {
  if (scanReportField) {
    // Permissions
    const canUpdate =
      permissions.includes("CanEdit") || permissions.includes("CanAdmin");

    const handleSubmit = async (data: FormData) => {
      const submittingData = {
        pass_from_source: data.fromSource,
        is_ignore: data.isIgnore,
        description_column: data.description,
      };

      const response = await updateScanReportField(
        scanreportId,
        scanReportField?.scan_report_table,
        scanReportField?.id.toString(),
        submittingData
      );
      if (response) {
        toast.error(`Update Dataset failed. Error: ${response.errorMessage}`);
      } else {
        toast.success("Update Dataset successful!");
      }
    };
    return (
      <Formik
        initialValues={{
          fromSource: scanReportField.pass_from_source,
          isIgnore: scanReportField.is_ignore,
          description: scanReportField.description_column,
        }}
        onSubmit={(data) => {
          handleSubmit(data);
        }}
      >
        {({ values, handleChange, handleSubmit }) => (
          <Form className="w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 text-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  onCheckedChange={(checked) => {
                    handleChange({
                      target: {
                        name: "isIgnore",
                        value: checked ? true : false,
                      },
                    });
                  }}
                  defaultChecked={scanReportField?.is_ignore}
                  disabled={!canUpdate}
                />
                <Label className="text-lg flex">
                  Is ignore <Tooltips content="" />
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  onCheckedChange={(checked) => {
                    handleChange({
                      target: {
                        name: "fromSource",
                        value: checked ? true : false,
                      },
                    });
                  }}
                  defaultChecked={scanReportField?.pass_from_source}
                  disabled={!canUpdate}
                />
                <Label className="text-lg flex">
                  Pass from source <Tooltips content="" />
                </Label>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="flex">
                  Description Column <Tooltips content="" />
                </h3>
                <Textarea
                  name="description"
                  onChange={handleChange}
                  value={values.description}
                  placeholder={scanReportField.description_column}
                />
              </div>
              <div>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-carrot text-white rounded text-lg"
                  disabled={!canUpdate}
                >
                  Save <Save className="ml-2" />
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    );
  }
}
