"use server";

import request from "@/lib/api/request";

const fetchKeys = {
  list: (scan_report_id: number, filter?: string) =>
    `scanreports/${scan_report_id}/mapping_rules/downloads${filter}`,
  download: (scan_report_id: number, file_id: number) =>
    `scanreports/${scan_report_id}/mapping_rules/downloads/?${file_id}`,
};

export async function list(
  scan_report_id: number,
  filter: string | undefined,
): Promise<PaginatedResponse<FileDownload> | null> {
  try {
    return await request<PaginatedResponse<MappingRule>>(
      fetchKeys.list(scan_report_id, filter),
    );
  } catch (error) {
    return null;
  }
}

export async function requestFile(
  scan_report_id: number,
): Promise<File | null> {
  try {
    return await request<File>(fetchKeys.list(scan_report_id), {
      method: "POST",
    });
  } catch (error) {
    return null;
  }
}

export async function download(
  scan_report_id: number,
  file_id: number,
): Promise<File | null> {
  try {
    return await request<File>(fetchKeys.download(scan_report_id, file_id));
  } catch (error) {
    return null;
  }
}
