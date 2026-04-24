import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { Outlet, PaginatedResponse } from "@/lib/types/api";

/**
 * Fetch all outlets for tenant
 * Returns paginated list, but typically there's only 1 outlet for MVP
 */
export async function getOutlets(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Outlet>> {
  try {
    const tenantId = await getTenantId();
    const api = await createServerAxios();
    const { data } = await api.get<PaginatedResponse<Outlet>>(
      `/tenants/${tenantId}/outlets`,
      { params: { page, limit } },
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch outlets:", error);
    throw error;
  }
}

/**
 * Get the first (default) outlet or the first available outlet
 * Used for MVP where users only have 1 outlet
 */
export async function getDefaultOrFirstOutlet(): Promise<Outlet | null> {
  try {
    const response = await getOutlets(1, 1);
    if (response.data && response.data.length > 0) {
      // Return first outlet (MVP: only 1 outlet per tenant)
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error("Failed to get default outlet:", error);
    return null;
  }
}
