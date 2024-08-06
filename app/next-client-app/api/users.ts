"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  currentUser: () => `user/me/`,
};

export async function getCurrentUser(): Promise<User> {
  try {
    return await request<User>(fetchKeys.currentUser());
  } catch (error) {
    return { id: 0, username: "Unknown User" };
  }
}
