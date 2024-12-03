import { Check, Loader2, X } from "lucide-react";

export const JobStage = [
  { id: 1, value: "UPLOAD_SCAN_REPORT", display_name: "Upload Scan Report" },
  {
    id: 2,
    value: "BUILD_CONCEPTS_FROM_DICT",
    display_name: "Build concepts from OMOP Data dictionary",
  },
  {
    id: 3,
    value: "REUSE_CONCEPTS",
    display_name: "Reuse concepts from other scan reports",
  },
  {
    id: 4,
    value: "GENERATE_RULES",
    display_name: "Auto generate mapping rules from available concepts",
  },
  {
    id: 5,
    value: "DOWNLOAD_RULES",
    display_name: "Generate and download mapping rules JSON",
  },
];

export const StageStatus = [
  {
    label: "Upload Complete",
    icon: Check,
    value: "COMPLETE",
    color: "text-green-600 dark:text-green-600",
  },
  {
    label: "Upload Failed",
    icon: X,
    value: "FAILED",
    color: "text-red-500 dark:text-red-500",
  },
  {
    label: "Upload In Progress",
    icon: Loader2,
    value: "IN_PROGRESS",
    color: "text-orange-500 dark:text-orange-500",
  },
];
