"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  userName: () => `username`,
};

export async function getUserName(): Promise<User[]> {
  try {
    return await request<User[]>(fetchKeys.userName());
  } catch (error) {
    return [{ id: 0, username: "Unknown User" }];
  }
}
