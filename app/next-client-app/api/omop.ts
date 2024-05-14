"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  omopFields: "omopfields/",
  omopTables: "omoptables/",
  omopTable: (table: string) => `omoptables/${table}/`,
};

export async function getOmopFields(): Promise<OmopField[]> {
  try {
    return await request<OmopField[]>(fetchKeys.omopFields);
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getOmopTables(): Promise<OmopTable[]> {
  try {
    return await request<OmopTable[]>(fetchKeys.omopTables);
  } catch (error) {
    console.warn("Failed to fetch data.");
    return [];
  }
}

export async function getOmopTable(table: string): Promise<OmopTable> {
  try {
    return await request<OmopTable>(fetchKeys.omopTable(table));
  } catch (error) {
    console.warn("Failed to fetch data.");
    return {
      id: 0,
      created_at: new Date(),
      updated_at: new Date(),
      table: "",
    };
  }
}
