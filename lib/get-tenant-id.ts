import { cookies } from "next/headers";

export async function getTenantId(): Promise<string> {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant_id")?.value;
  if (!tenantId) throw new Error("Not authenticated");
  return tenantId;
}
