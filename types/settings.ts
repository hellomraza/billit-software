export interface Tenant {
  id: string;
  businessName: string;
  businessAbbreviation: string;
}

export interface Outlet {
  id: string;
  tenantId: string;
  outletName: string;
  outletAbbreviation: string;
}

export interface GSTSettings {
  isRegistered: boolean;
  gstNumber?: string;
}
