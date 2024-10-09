import { Check, Loader2, X } from "lucide-react";

export const UploadStatusOptions = [
  {
    label: "Upload Complete",
    icon: Check,
    value: "UPCOMPL",
    color: "text-green-600 dark:text-green-600",
  },
  {
    label: "Upload Failed",
    icon: X,
    value: "UPFAILE",
    color: "text-red-500 dark:text-red-500",
  },
  {
    label: "Upload In Progress",
    icon: Loader2,
    value: "UPINPRO",
    color: "text-orange-500 dark:text-orange-500",
  },
];

export const MappingStatusOptions = [
  {
    label: "Blocked",
    value: "BLOCKED",
    color: "text-red-900 dark:text-red-600",
  },
  {
    label: "Mapping Complete",
    value: "COMPLET",
    color: "text-green-600 dark:text-green-600",
  },
  {
    label: "Mapping 0%",
    value: "PENDING",
    color: "text-blue-500 dark:text-blue-500",
  },
  {
    label: "Mapping 25%",
    value: "INPRO25",
    color: "text-orange-300 dark:text-orange-300",
  },
  {
    label: "Mapping 50%",
    value: "INPRO50",
    color: "text-orange-400 dark:text-orange-400",
  },
  {
    label: "Mapping 75%",
    value: "INPRO75",
    color: "text-orange-500 dark:text-orange-500",
  },
];
