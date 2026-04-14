import { Tenant, Outlet, GSTSettings } from "@/types";
import { delay } from "./delay";

const MOCK_TENANT: Tenant = {
  id: "t_1",
  businessName: "SuperMart Central",
  businessAbbreviation: "SMC",
};

const MOCK_OUTLET: Outlet = {
  id: "o_1",
  tenantId: "t_1",
  outletName: "Downtown Branch",
  outletAbbreviation: "DTB",
};

const MOCK_GST: GSTSettings = {
  isRegistered: true,
  gstNumber: "22AAAAA0000A1Z5",
};

export async function getTenant() {
  await delay(300);
  return MOCK_TENANT;
}

export async function getOutlet() {
  await delay(300);
  return MOCK_OUTLET;
}

export async function getGSTSettings() {
  await delay(300);
  return MOCK_GST;
}
