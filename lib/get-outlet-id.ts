import { cookies } from "next/headers";

export async function getOutletId(): Promise<string> {
  const cookieStore = await cookies();
  const outletId = cookieStore.get("outlet_id")?.value;
  if (!outletId) throw new Error("Outlet ID not found");
  return outletId;
}
