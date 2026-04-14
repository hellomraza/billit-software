export const ROUTES = {
  BILLING: "/",
  PRODUCTS: "/products",
  PRODUCTS_NEW: "/products/new",
  PRODUCTS_IMPORT: "/products/import",
  PRODUCTS_EDIT: (id: string) => `/products/${id}/edit`,
  INVOICES: "/invoices",
  INVOICE_DETAIL: (id: string) => `/invoices/${id}`,
  DEFICITS: "/deficits",
  SETTINGS: "/settings",
  AUTH_LOGIN: "/login",
  AUTH_SIGNUP: "/signup",
  AUTH_FORGOT_PASSWORD: "/forgot-password",
  AUTH_RESET_PASSWORD: "/reset-password",
  ONBOARDING_BUSINESS: "/business",
  ONBOARDING_OUTLET: "/outlet",
  ONBOARDING_GST: "/gst"
};
