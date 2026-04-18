"use server";

import { createServerAxios } from "@/lib/axios/server";

export async function getSettings() {
  const api = await createServerAxios();
  const { data } = await api.get("/settings");
  return data;
}
