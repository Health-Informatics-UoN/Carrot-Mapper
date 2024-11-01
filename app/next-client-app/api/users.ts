"use server";
import request from "@/lib/api/request";

const fetchKeys = {
  currentUser: () => `user/me/`,
};

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await request<User>(fetchKeys.currentUser());
  } catch (error) {
    return null;
  }
}
