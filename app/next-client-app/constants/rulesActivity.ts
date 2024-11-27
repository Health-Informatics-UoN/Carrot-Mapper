import {
  Building,
  Check,
  CircleSlash,
  ListMinus,
  Loader2,
  Recycle,
  X,
} from "lucide-react";

export const RulesActivities = [
  {
    id: 0,
    activity: "NOT_STARTED",
    display_name: "Not started yet.",
    icon: CircleSlash,
    color: "text-gray-600 dark:text-gray-600",
  },
  {
    id: 1,
    activity: "QUEUED",
    display_name: "Rules activity is queued.",
    icon: ListMinus,
    color: "text-gray-600 dark:text-gray-600",
  },
  {
    id: 2,
    activity: "BUILDING_FROM_VOCAB",
    display_name: "Building mapping rules from vocabulary dictionary.",
    icon: Building,
    color: "text-amber-600 dark:text-amber-600",
  },
  {
    id: 3,
    activity: "REUSING_CONCEPTS",
    display_name: "Reusing Concepts from completed Scan Report.",
    icon: Recycle,
    color: "text-blue-600 dark:text-blue-600",
  },
  {
    id: 4,
    activity: "FINISHED",
    display_name: "Rules generation activities finished.",
    icon: Check,
    color: "text-green-600 dark:text-green-600",
  },
  // {
  //   id: 5,
  //   activity: "FAILED",
  //   display_name: "Rules generation activities failed.",
  //   icon: X,
  //   color: "text-red-600 dark:text-red-600",
  // },
];

export const ActivityStatus = [
  {
    id: 0,
    status: "IN_PROGRESS",
    display_name: "The rules activity is in progress.",
  },
  { id: 1, status: "FAILED", display_name: "The rules activity has failed." },
];
