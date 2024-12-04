import { Check, CircleSlash, Loader2, X } from "lucide-react";

export const JobStage = [
  { id: 1, value: "UPLOAD_SCAN_REPORT", display_name: "Upload Scan Report" },
  {
    id: 2,
    value: "BUILD_CONCEPTS_FROM_DICT",
    display_name: "Building concepts from OMOP Data dictionary",
  },
  {
    id: 3,
    value: "REUSE_CONCEPTS",
    display_name: "Reusing concepts from other scan reports",
  },
  {
    id: 4,
    value: "GENERATE_RULES",
    display_name: "Automatic generating mapping rules from available concepts",
  },
  {
    id: 5,
    value: "DOWNLOAD_RULES",
    display_name: "Generate and download mapping rules JSON",
  },
];

export const StageStatus = [
  {
    label: "Not Started",
    icon: CircleSlash,
    value: "NOT_STARTED",
    color: "text-gray-600 dark:text-gray-600",
  },
  {
    label: "Job Queued",
    icon: CircleSlash,
    value: "QUEUED",
    color: "text-gray-600 dark:text-gray-600",
  },
  {
    label: "Job Complete",
    icon: Check,
    value: "COMPLETE",
    color: "text-green-600 dark:text-green-600",
  },
  {
    label: "Job Failed",
    icon: X,
    value: "FAILED",
    color: "text-red-500 dark:text-red-500",
  },
  {
    label: "Job In Progress",
    icon: Loader2,
    value: "IN_PROGRESS",
    color: "text-orange-500 dark:text-orange-500",
  },
];

export const GeneralStatus = [
  {
    label:
      "Not Started or No data yet. Start by update table's Person ID and Date event",
    icon: CircleSlash,
    value: "NOT_STARTED",
    color: "text-gray-600 dark:text-gray-600",
  },
  {
    label: "Complete. Click for details.",
    icon: Check,
    value: "COMPLETE",
    color: "text-green-600 dark:text-green-600",
  },
  {
    label: "Failed. Click for details.",
    icon: X,
    value: "FAILED",
    color: "text-red-500 dark:text-red-500",
  },
  {
    label: "In Progress. Click for details.",
    icon: Loader2,
    value: "IN_PROGRESS",
    color: "text-orange-500 dark:text-orange-500",
  },
];
