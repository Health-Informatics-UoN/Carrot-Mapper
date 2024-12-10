/**
 * Interface for list view parameters.
 */
export interface FilterParameters {
  hidden?: boolean;
  page_size?: number;
  p?: number;
  ordering?: string;
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}
