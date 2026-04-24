"use server";

import { createServerAxios } from "@/lib/axios/server";
import { Tenant } from "../types/api";

export async function getSettings() {
  const api = await createServerAxios();
  const { data } = await api.get<Tenant>("/settings");
  return data;
}
