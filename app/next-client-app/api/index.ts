"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  specificUser: () => `userspecific`,
};

export async function getUser(): Promise<User[]> {
  try {
    return await request<User[]>(fetchKeys.specificUser());
  } catch (error) {
    return [];
  }
}
