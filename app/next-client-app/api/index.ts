"use server";
import request from "@/lib/api/request";
import { redirect } from "next/navigation";

const fetchKeys = {
  specificUser: () => `userspecific`,
};

export async function getUser(): Promise<User[]> {
  try {
    return await request<User[]>(fetchKeys.specificUser());
  } catch (error) {
    console.log("dasd");
    redirect("/accounts/login/");
  }
}
