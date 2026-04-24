"use server";

import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { DeficitGroup, DeficitRecord, PaginatedResponse } from "@/lib/types/api";

export interface DeficitsWithStatusFilters {
  status?: "PENDING" | "RESOLVED";
  page?: number;
  limit?: number;
}

export async function getDeficitsGroupedByProduct(): Promise<DeficitGroup[]> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();

  const { data } = await api.get<PaginatedResponse<DeficitGroup>>(
    `/tenants/${tenantId}/deficits/grouped-by-product`,
  );

  return data.data;
}

export async function getDeficitsWithStatus(
  filters: DeficitsWithStatusFilters = {},
): Promise<PaginatedResponse<DeficitRecord>> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();
  const { status = "PENDING", page = 1, limit = 20 } = filters;

  const { data } = await api.get<PaginatedResponse<DeficitRecord>>(
    `/tenants/${tenantId}/deficits/with-status`,
    {
      params: {
        status,
        page,
        limit,
      },
    },
  );

  return data;
}
