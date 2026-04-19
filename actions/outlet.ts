"use server";

import { getDefaultOrFirstOutlet } from "@/lib/api/outlets";
import { cookies } from "next/headers";

/**
 * Server Action to ensure outlet_id is set in cookies
 * If not present, fetches the first (default) outlet and sets it
 * Returns the outlet_id, or null if no outlets exist
 */
export async function ensureOutletIdAction(): Promise<string | null> {
  const cookieStore = await cookies();

  // Check if outlet_id already exists in cookies
  const existingOutletId = cookieStore.get("outlet_id")?.value;
  if (existingOutletId) {
    return existingOutletId;
  }

  // outlet_id not set, fetch and auto-select first outlet
  const outlet = await getDefaultOrFirstOutlet();
  if (!outlet) {
    console.error("No outlets found for tenant");
    return null;
  }

  // Set outlet_id in cookie for future requests (7 days)
  cookieStore.set("outlet_id", outlet._id, {
    maxAge: 7 * 24 * 60 * 60,
    sameSite: "lax",
    path: "/",
  });

  return outlet._id;
}
