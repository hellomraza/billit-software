# MVP 1 — API Integration Guide for AI Agent

**Version:** 1.0  
**Purpose:** Complete, unambiguous guide for integrating all backend APIs into the existing Next.js frontend.  
**Stack:** Next.js 16.2.3 · App Router · TypeScript · Axios · Zod · Server Actions · Server Components  
**Last Updated:** 2026-04-13

---

## 0. How to Use This Document

This document is the single source of truth for API integration. Every API endpoint is listed with its exact request shape, response shape, where it is called (server component or server action), zod schema, and which page(s) to revalidate. Track completion using the checkboxes. Do not skip sections. Do not deviate from the patterns defined in Section 2.

---

## 1. Architecture Overview

### 1.1 Data Flow Rules

| Operation Type                           | Mechanism                                 | Where                      |
| ---------------------------------------- | ----------------------------------------- | -------------------------- |
| All GET requests                         | Async server component with `await`       | `app/**/page.tsx` (server) |
| All mutations (POST, PUT, PATCH, DELETE) | Server action via `validatedAction` HOF   | `actions/*.ts`             |
| Form submissions                         | `useActionState` hook in client component | `features/**/*-form.tsx`   |
| File uploads (CSV)                       | Server action with FormData               | `actions/products.ts`      |

### 1.2 Token Storage and Flow

```
Login/Signup response: { accessToken, tenant }
  ↓
Save to:
  - localStorage key: 'access_token'
  - Cookie name: 'access_token' (HttpOnly: false, so JS can set it)
  - localStorage key: 'tenant' (JSON stringified tenant object)
  - Cookie name: 'tenant_id' (just the tenant ID string)

Client-side axios reads: localStorage.getItem('access_token')
Server-side axios reads: cookies().get('access_token')?.value
```

### 1.3 TenantId Resolution

Most API endpoints require `tenantId` as a path parameter. The tenantId comes from the stored tenant object.

- **In server actions / server-side:** Read from `cookies().get('tenant_id')?.value`
- **In client components:** Read from `localStorage.getItem('tenant')` parsed as JSON, then `.id` field
- **Never hardcode tenantId.** Always read from session.

### 1.4 Folder Structure for Integration Layer

Create these files (do not modify existing UI files unless wiring is needed):

```
lib/
  axios/
    client.ts          ← client-side axios instance (reads localStorage)
    server.ts          ← server-side axios instance (reads cookies)
  api/
    auth.ts            ← GET query functions for auth/session
    onboarding.ts      ← GET query functions for onboarding
    products.ts        ← GET query functions for products + stock
    invoices.ts        ← GET query functions for invoices
    deficits.ts        ← GET query functions for deficits
    settings.ts        ← GET query functions for settings
  types/
    api.ts             ← All API request/response types (mirror PRD data model)

actions/
  auth.ts              ← signup, login, logout, forgot-password, reset-password, change-password
  onboarding.ts        ← business, outlet, gst, complete
  products.ts          ← create, update, delete, restore, update-stock, csv-import
  invoices.ts          ← create invoice (two-phase)
  deficits.ts          ← resolve-stock-addition, resolve-adjustment
  settings.ts          ← update-business, update-gst, change-password

middleware.ts          ← route protection (reads cookie, redirects if no token)
```

---

## 2. Foundation — Must Build First

### 2.1 ActionState Type and validatedAction HOF

Create `lib/safe-action.ts`:

```typescript
import { z } from "zod";

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>,
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message, success: "" };
    }
    return action(result.data, formData);
  };
}
```

### 2.2 Server-Side Axios Instance

Create `lib/axios/server.ts`:

```typescript
import axios from "axios";
import { cookies } from "next/headers";

export function createServerAxios() {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;

  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 10000,
  });

  // Response interceptor: normalize errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An unexpected error occurred";
      return Promise.reject(new Error(message));
    },
  );

  return instance;
}
```

**Usage in server actions and query functions:**

```typescript
const api = createServerAxios();
const { data } = await api.get("/some-endpoint");
```

### 2.3 Client-Side Axios Instance

Create `lib/axios/client.ts`:

```typescript
"use client";
import axios from "axios";

const clientAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// Request interceptor: inject token from localStorage
clientAxios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: normalize errors
clientAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  },
);

export default clientAxios;
```

**Note:** `clientAxios` is only used in client components that need real-time interaction (e.g., product search in billing, stock refresh). All other data fetching uses `createServerAxios()` in server components.

### 2.4 Token Helpers

Create `lib/auth-tokens.ts` (client-safe only, used in client components):

```typescript
// Call this immediately after successful login/signup
export function saveAuthSession(accessToken: string, tenant: Tenant) {
  // Save to localStorage for client axios
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("tenant", JSON.stringify(tenant));

  // Save to cookies for server axios (JS-accessible cookie)
  document.cookie = `access_token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  document.cookie = `tenant_id=${tenant._id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearAuthSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("tenant");
  document.cookie = "access_token=; path=/; max-age=0";
  document.cookie = "tenant_id=; path=/; max-age=0";
}

export function getStoredTenant(): Tenant | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("tenant");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
```

### 2.5 TenantId Helper for Server Actions

Create `lib/get-tenant-id.ts` (used inside server actions):

```typescript
import { cookies } from "next/headers";

export function getTenantId(): string {
  const cookieStore = cookies();
  const tenantId = cookieStore.get("tenant_id")?.value;
  if (!tenantId) throw new Error("Not authenticated");
  return tenantId;
}
```

### 2.6 Middleware (Route Protection)

Create `middleware.ts` at project root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];
const ONBOARDING_ROUTES = ["/onboarding"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const pathname = request.nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingRoute = ONBOARDING_ROUTES.some((r) =>
    pathname.startsWith(r),
  );

  // Not authenticated: redirect to login (except public routes)
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated on public route: redirect to billing
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
```

### 2.7 Environment Variable

Add to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2.8 API Types

Create `lib/types/api.ts` — mirror the PRD data model and swagger response shapes:

```typescript
// Tenant
export interface Tenant {
  _id: string;
  email: string;
  businessName: string;
  businessAbbr: string;
  gstNumber?: string;
  gstEnabled: boolean;
  abbrLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Outlet
export interface Outlet {
  _id: string;
  tenantId: string;
  outletName: string;
  outletAbbr: string;
  isDefault: boolean;
  abbrLocked: boolean;
  createdAt: string;
}

// Product
export interface Product {
  _id: string;
  tenantId: string;
  name: string;
  basePrice: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
  deficitThreshold: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// StockRecord
export interface StockRecord {
  _id: string;
  productId: string;
  outletId: string;
  quantity: number;
  updatedAt: string;
}

// ProductWithStock (combined for product list)
export interface ProductWithStock extends Product {
  stock?: number;
}

// Invoice Item
export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
  override?: boolean;
}

// Invoice
export interface Invoice {
  _id: string;
  tenantId: string;
  outletId: string;
  invoiceNumber: string;
  clientGeneratedId: string;
  items: InvoiceItem[];
  subtotal: number;
  totalGstAmount: number;
  grandTotal: number;
  paymentMethod: "CASH" | "CARD" | "UPI";
  customerName?: string;
  customerPhone?: string;
  isGstInvoice: boolean;
  tenantGstNumber?: string;
  isDeleted: boolean;
  createdAt: string;
}

// Deficit Record
export interface DeficitRecord {
  _id: string;
  tenantId: string;
  productId: string;
  outletId: string;
  quantity: number;
  linkedInvoiceId: string;
  status: "PENDING" | "RESOLVED";
  resolutionMethod?: "STOCK_ADDITION" | "ADJUSTMENT";
  adjustmentReason?: "DAMAGE" | "LOSS" | "CORRECTION";
  resolvedAt?: string;
  createdAt: string;
}

// Grouped deficit (for deficit management screen)
export interface DeficitGroup {
  productId: string;
  productName: string;
  totalPendingQuantity: number;
  recordCount: number;
  mostRecentDate: string;
  deficitThreshold: number;
  records: DeficitRecord[];
}

// Onboarding Status
export interface OnboardingStatus {
  completed: boolean;
  steps: {
    business: boolean;
    outlet: boolean;
    gst: boolean;
  };
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Invoice creation - insufficient stock response
export interface InsufficientStockItem {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
  deficitThresholdExceeded: boolean;
}

export interface InsufficientStockResponse {
  status: "STOCK_INSUFFICIENT";
  insufficientItems: InsufficientStockItem[];
}

// Invoice creation success response
export interface InvoiceCreatedResponse {
  invoiceId: string;
  invoiceNumber: string;
  createdAt: string;
  items: InvoiceItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: string;
  customerDetails: { name?: string; phone?: string };
  gstDetails: { enabled: boolean; gstNumber?: string };
  abbreviationsLocked: boolean;
}
```

---

## 3. Section-by-Section Integration Checklist

---

## SECTION A: Authentication

**Files:** `lib/api/auth.ts` · `actions/auth.ts`  
**Relevant screens:** `/login` · `/signup` · `/forgot-password` · `/reset-password`

---

### A.1 Signup

**Endpoint:** `POST /auth/signup`  
**Request:** `{ email: string, password: string }`  
**Response 201:** `{ accessToken: string, tenant: Tenant }`  
**Response 400:** validation error  
**Response 409:** email already exists  
**Mechanism:** Server Action (form submit on signup page)  
**After success:** Call `saveAuthSession(accessToken, tenant)` in the client component that wraps the form, then `router.push('/onboarding/business')`

**Zod Schema:**

```typescript
const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /(?=.*[a-zA-Z])(?=.*[0-9])/,
      "Password must contain at least one letter and one number",
    ),
});
```

**Server Action:**

```typescript
// actions/auth.ts
"use server";
import { validatedAction } from "@/lib/safe-action";
import { createServerAxios } from "@/lib/axios/server";

export const signupAction = validatedAction(signupSchema, async (data) => {
  try {
    const api = createServerAxios();
    const { data: res } = await api.post("/auth/signup", data);
    // Return token and tenant to client — client component handles saveAuthSession
    return {
      success: "Account created successfully",
      accessToken: res.accessToken,
      tenant: res.tenant,
    };
  } catch (err: any) {
    return { error: err.message };
  }
});
```

**Client Wiring Pattern (signup page client component):**

```typescript
"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signupAction } from "@/actions/auth";
import { saveAuthSession } from "@/lib/auth-tokens";

const [state, formAction, isPending] = useActionState(signupAction, {
  error: "",
  success: "",
});

useEffect(() => {
  if (state.accessToken && state.tenant) {
    saveAuthSession(state.accessToken, state.tenant);
    router.push("/onboarding/business");
  }
}, [state]);
```

- [x] Create `signupSchema` in `actions/auth.ts`
- [x] Create `signupAction` server action
- [x] Wire form in `features/auth/signup-form.tsx` using `useActionState`
- [x] Call `saveAuthSession` on success in effect
- [x] Redirect to `/onboarding/business` on success
- [x] Show `state.error` inline on form
- [x] Disable submit button when `isPending`

---

### A.2 Login

**Endpoint:** `POST /auth/login`  
**Request:** `{ email: string, password: string }`  
**Response 200:** `{ accessToken: string, tenant: Tenant }`  
**Response 401:** invalid credentials  
**Mechanism:** Server Action  
**After success:** `saveAuthSession`, then check onboarding status → redirect to `/onboarding/business` if incomplete, else redirect to `/`

**Zod Schema:**

```typescript
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
```

**Onboarding check after login:** After `saveAuthSession`, call `GET /onboarding/status` (using client axios with the new token). If `completed === false`, redirect to `/onboarding/business`. Else redirect to `/`.

- [x] Create `loginSchema` in `actions/auth.ts`
- [x] Create `loginAction` server action
- [x] Wire form in `features/auth/login-form.tsx` using `useActionState`
- [x] Call `saveAuthSession` on success in effect
- [x] Check onboarding status after login (client-side, using clientAxios with new token)
- [x] Redirect to `/onboarding/business` if onboarding incomplete
- [x] Redirect to `/` if onboarding complete
- [x] Show generic error "Incorrect email or password." for 401
- [x] Disable submit button when `isPending`

---

### A.3 Logout

**Endpoint:** `POST /auth/logout`  
**Request:** (no body, just the auth header)  
**Response 200:** `{ message: string }`  
**Mechanism:** Server Action (triggered from settings page or nav)  
**After success:** Call `clearAuthSession()` in client, redirect to `/login`

**Zod Schema:** None needed (no inputs).

```typescript
// actions/auth.ts
export async function logoutAction(): Promise<ActionState> {
  try {
    const api = createServerAxios();
    await api.post("/auth/logout");
    return { success: "Logged out" };
  } catch {
    // Always clear session even if server call fails
    return { success: "Logged out" };
  }
}
```

**Client wiring:** After calling `logoutAction()`, call `clearAuthSession()` and `router.push('/login')`.

- [x] Create `logoutAction` in `actions/auth.ts`
- [x] Wire logout button in nav/settings with confirmation
- [x] Call `clearAuthSession()` client-side after action resolves
- [x] Redirect to `/login`

---

### A.4 Forgot Password

**Endpoint:** `POST /auth/forgot-password`  
**Request:** `{ email: string }`  
**Response 200 (Production):** `{ message: string }` (no token, email sent instead)  
**Response 200 (Development):** `{ message: string, resetToken: string }` (token returned directly)  
**Mechanism:** Server Action

#### Development Environment Note

In development, the API returns the `resetToken` directly in the response body for convenience (no email sending). In production, no token is returned and an email is sent to the user instead.

**How to handle both environments in `forgotPasswordAction`:**

```typescript
export const forgotPasswordAction = validatedAction(
  forgotPasswordSchema,
  async (data) => {
    try {
      const api = createServerAxios();
      const { data: res } = await api.post("/auth/forgot-password", data);
      return {
        success: "Reset link sent.",
        // In dev, API returns the token directly — pass it to the client
        resetToken: res.resetToken ?? null,
      };
    } catch (err: any) {
      // Always return generic success message — never expose account existence
      return {
        success:
          "If an account with that email exists, you will receive a reset link.",
      };
    }
  },
);
```

**Client component behavior in `forgot-password-form.tsx`:**

When `state.resetToken` is present (dev only), auto-redirect to the reset password page. Otherwise (production), show the confirmation message:

```typescript
useEffect(() => {
  if (state.resetToken) {
    // Dev only: directly navigate to reset page with the token
    router.push(`/reset-password?token=${state.resetToken}`);
  } else if (state.success) {
    // Prod: show "check your email" message
    setShowConfirmation(true);
  }
}, [state]);
```

**Zod Schema:**

```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
```

**Important UI rule:** Always show the same success message regardless of whether the email exists: "If an account with that email exists, you'll receive a reset link." Never show an error that reveals account existence.

- [x] Create `forgotPasswordSchema` + `forgotPasswordAction` in `actions/auth.ts`
- [x] Wire form in `features/auth/forgot-password-form.tsx`
- [x] Show success state regardless of server response (hide form, show confirmation message)
- [x] Never expose "email not found" error to UI
- [x] Handle `resetToken` in state: redirect to `/reset-password?token=...` if present (dev), otherwise show confirmation (prod)

---

### A.5 Reset Password

**Endpoint:** `POST /auth/reset-password`  
**Request:** `{ token: string, newPassword: string }`  
**Response 200:** `{ message: string }` (API also sends confirmation email)  
**Response 400:** invalid/expired token  
**Mechanism:** Server Action  
**Token source:** URL query param `?token=...` (read via `searchParams` in page component, passed as hidden input)

#### Email Behavior

When user successfully resets their password:

1. **Password is updated** on the server
2. **Confirmation email is sent** to the user's registered email address confirming the password change
3. Shows success message: "Password reset successfully. A confirmation email has been sent."

#### Development Environment Note

**No code changes needed for A.5.** It reads the token from the URL query param `?token=...` regardless of how the user arrived at that page:

- **Development:** User submits forgot-password form → API returns `resetToken` → client redirects to `/reset-password?token=<resetToken>` automatically
- **Production:** User clicks email link (which already has `?token=...` in it) → user lands on reset-password page
- **Manual testing:** Developer manually visits `/reset-password?token=...` in browser

The implementation is environment-agnostic — it simply reads the token from the URL param and submits it to the API.

**Zod Schema:**

```typescript
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /(?=.*[a-zA-Z])(?=.*[0-9])/,
        "Password must contain at least one letter and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

**Page pattern:**

```typescript
// app/(auth)/reset-password/page.tsx - server component
export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  if (!token) return <InvalidTokenState />;
  return <ResetPasswordForm token={token} />;
}
```

```typescript
// features/auth/reset-password-form.tsx - client component
// token passed as hidden input: <input type="hidden" name="token" value={token} />
// Success message should acknowledge confirmation email: "Password reset successfully. A confirmation email has been sent."
```

- [x] Create `resetPasswordSchema` + `resetPasswordAction` in `actions/auth.ts`
- [x] Read `token` from `searchParams` in page (server component)
- [x] Pass token as hidden input to form
- [x] Show "Invalid or expired link" state if no token in URL
- [x] Show success state with link to login after success
- [x] Show inline error if 400 (token invalid/expired)
- [x] Success message should note that confirmation email has been sent

---

### A.6 Change Password (from Settings)

**Endpoint:** `POST /settings/change-password`  
**Request:** `{ currentPassword: string, newPassword: string }`  
**Response 200:** `{ message: string }`  
**Response 400:** wrong current password  
**Mechanism:** Server Action  
**revalidatePath:** `/settings`

**Zod Schema:**

```typescript
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /(?=.*[a-zA-Z])(?=.*[0-9])/,
        "Password must contain at least one letter and one number",
      ),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
```

- [x] Create `changePasswordSchema` + `changePasswordAction` in `actions/settings.ts`
- [x] Wire form in `features/settings/change-password-form.tsx`
- [x] Call `revalidatePath('/settings')` after success
- [x] Show success message on success
- [x] Show inline error on 400 (wrong current password)

---

## SECTION B: Onboarding

**Files:** `lib/api/onboarding.ts` · `actions/onboarding.ts`  
**Relevant screens:** `/onboarding/business` · `/onboarding/outlet` · `/onboarding/gst`

**Important:** Onboarding routes must check completion status. If already complete, redirect to `/`.

---

### B.1 Get Onboarding Status

**Endpoint:** `GET /onboarding/status`  
**Response 200:** `{ completed: boolean, steps: { business: boolean, outlet: boolean, gst: boolean } }`  
**Mechanism:** Server component (async page or layout)  
**Use:** In each onboarding step layout to verify which steps are complete and enforce ordering.

```typescript
// lib/api/onboarding.ts
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const api = createServerAxios();
  const { data } = await api.get("/onboarding/status");
  return data;
}
```

- [x] Create `getOnboardingStatus()` in `lib/api/onboarding.ts`
- [x] Call in `app/(onboarding)/layout.tsx` — redirect to `/` if `completed === true`
- [x] Use step completion flags to show progress indicator correctly

---

### B.2 Update Business Information

**Endpoint:** `PATCH /onboarding/business`  
**Request:** `{ businessName: string, businessAbbr: string }`  
**Response 200:** `{ message: string }`  
**Response 409:** abbreviation conflict  
**Mechanism:** Server Action  
**After success:** Redirect to `/onboarding/outlet`

**Zod Schema:**

```typescript
const onboardingBusinessSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(100),
  businessAbbr: z
    .string()
    .min(3, "Abbreviation must be at least 3 characters")
    .max(6, "Abbreviation must be at most 6 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Abbreviation must be uppercase letters and numbers only",
    )
    .transform((val) => val.toUpperCase()),
});
```

**Abbreviation auto-generation:** This is client-side logic only. When the user types the business name, the client computes the abbreviation preview using the algorithm from the PRD (Section 6). This happens in the client component via `onChange` on the business name input. The generated abbreviation is pre-filled into the abbreviation input, which the user can edit.

**Algorithm implementation in client:**

```typescript
// lib/utils/abbreviation.ts
export function generateAbbreviation(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  let abbr = "";
  if (words.length >= 2) {
    abbr = words.map((w) => w[0]).join("");
  } else if (words.length === 1) {
    abbr = words[0].substring(0, 3);
  }
  // Pad to minimum 3 chars using first word
  if (abbr.length < 3 && words[0]) {
    abbr = (abbr + words[0]).substring(0, 3);
  }
  // Truncate to max 6 chars
  abbr = abbr.substring(0, 6).toUpperCase();
  return abbr;
}
```

- [x] Implement `generateAbbreviation()` in `lib/utils/abbreviation.ts`
- [x] Create `onboardingBusinessSchema` + `updateOnboardingBusinessAction` in `actions/onboarding.ts`
- [x] Auto-generate abbreviation on `businessName` input change (client component)
- [x] Allow user to edit abbreviation (pre-filled, editable)
- [x] Validate abbreviation: uppercase transform, 3–6 chars, alphanumeric only
- [x] Redirect to `/onboarding/outlet` on success
- [x] Show error on 409 (conflict)

---

### B.3 Update Outlet Information

**Endpoint:** `PATCH /onboarding/outlet`  
**Request:** `{ outletName: string, outletAbbr: string }`  
**Response 200:** `{ message: string }`  
**Mechanism:** Server Action  
**After success:** Redirect to `/onboarding/gst`

**Zod Schema:**

```typescript
const onboardingOutletSchema = z.object({
  outletName: z.string().min(1, "Outlet name is required").max(100),
  outletAbbr: z
    .string()
    .min(3, "Abbreviation must be at least 3 characters")
    .max(6, "Abbreviation must be at most 6 characters")
    .regex(
      /^[A-Z0-9]+$/,
      "Abbreviation must be uppercase letters and numbers only",
    )
    .transform((val) => val.toUpperCase()),
});
```

**Default outlet name pre-fill:** Pre-fill the outlet name input with "Main". User can change it.

- [x] Create `onboardingOutletSchema` + `updateOnboardingOutletAction` in `actions/onboarding.ts`
- [x] Pre-fill outlet name with "Main"
- [x] Auto-generate abbreviation same as business step (reuse `generateAbbreviation`)
- [x] Redirect to `/onboarding/gst` on success

---

### B.4 Update GST Information

**Endpoint:** `PATCH /onboarding/gst`  
**Request:** `{ gstNumber: string }` (optional — send empty string if skipped)  
**Response 200:** `{ message: string }`  
**Mechanism:** Server Action  
**After success:** Call `POST /onboarding/complete` then redirect to `/`

**Zod Schema:**

```typescript
const onboardingGstSchema = z.object({
  gstNumber: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // optional
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          val,
        );
      },
      {
        message:
          "GSTIN format looks incorrect, but you can still save and update later",
      },
    ),
});
```

**Important:** GST number format warning must NOT block form submission. The zod refinement should use `.superRefine` or the action should handle invalid format as a soft warning (show warning but still submit). One approach: validate format on client, show warning, allow submission regardless.

**Simpler approach:** Remove hard validation from schema. Let the action always succeed. Show a visual warning in the form if the format doesn't match but do not return an error from the action.

- [x] Create `onboardingGstSchema` + `updateOnboardingGstAction` in `actions/onboarding.ts`
- [x] Show GSTIN format inline warning without blocking (soft validation)
- [x] "Skip" button submits with empty gstNumber
- [x] After PATCH /onboarding/gst success → call `POST /onboarding/complete`
- [x] Update stored tenant object in localStorage/cookie with new gstEnabled info
- [x] Redirect to `/` (billing screen)

---

### B.5 Complete Onboarding

**Endpoint:** `POST /onboarding/complete`  
**Request:** (no body)  
**Response 200:** `{ message: string }`  
**Mechanism:** Called inside `updateOnboardingGstAction` after the GST PATCH succeeds.

```typescript
// Inside updateOnboardingGstAction, after successful PATCH /onboarding/gst:
await api.post("/onboarding/complete");
revalidatePath("/");
redirect("/");
```

- [x] Call `POST /onboarding/complete` as part of GST action chain
- [x] Use `redirect('/')` from `next/navigation` (server-side) after completion

---

## SECTION C: Settings

**Files:** `lib/api/settings.ts` · `actions/settings.ts`  
**Relevant screen:** `/settings`

---

### C.1 Get Settings

**Endpoint:** `GET /settings`  
**Response 200:** Returns tenant info, outlet info, GST settings  
**Mechanism:** Async server component

```typescript
// lib/api/settings.ts
export async function getSettings() {
  const api = createServerAxios();
  const { data } = await api.get("/settings");
  return data;
}
```

**Page pattern:**

```typescript
// app/(dashboard)/settings/page.tsx
export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsScreen settings={settings} />;
}
```

- [x] Create `getSettings()` in `lib/api/settings.ts`
- [x] Call in `app/(dashboard)/settings/page.tsx`
- [x] Pass settings data to `SettingsScreen` component
- [x] Show abbrLocked state: read-only fields with visual indicator

---

### C.2 Update Business Settings

**Endpoint:** `PATCH /settings/business`  
**Request:** `{ businessName: string }`  
**Response 200:** `{ message: string }`  
**Mechanism:** Server Action  
**revalidatePath:** `/settings`

**Zod Schema:**

```typescript
const updateBusinessSettingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(100),
});
```

**Note:** Only `businessName` is editable in settings. The `businessAbbr` is only editable if `abbrLocked === false`. If the settings response shows `abbrLocked === false`, show the abbreviation as editable; if true, show as read-only.

- [x] Create `updateBusinessSettingsSchema` + `updateBusinessSettingsAction` in `actions/settings.ts`
- [x] Wire form in `features/settings/business-settings-form.tsx`
- [x] Show abbreviation as read-only if `abbrLocked === true`
- [x] Call `revalidatePath('/settings')` after success

---

### C.3 Update GST Settings

**Endpoint:** `PATCH /settings/gst`  
**Request:** `{ gstNumber: string, gstEnabled: boolean }`  
**Response 200:** `{ message: string }`  
**Mechanism:** Server Action  
**revalidatePath:** `/settings` and `/` (billing page needs updated GST toggle state)

**Zod Schema:**

```typescript
const updateGstSettingsSchema = z.object({
  gstNumber: z.string().optional(),
  gstEnabled: z.coerce.boolean(),
});
```

**Important:** The GST toggle in the top navigation must reflect `tenant.gstEnabled`. After this action succeeds, the local tenant state needs to update. Options:

- `revalidatePath('/')` causes the billing page to re-render and fetch fresh settings
- The nav component reads from server-side (no stale state issue)

- [x] Create `updateGstSettingsSchema` + `updateGstSettingsAction` in `actions/settings.ts`
- [x] Wire GST toggle and GST number form in `features/settings/gst-settings-form.tsx`
- [x] Call `revalidatePath('/settings')` and `revalidatePath('/')` after success
- [ ] GST toggle in nav: read `gstEnabled` from server (fetched in layout or billing page)

---

## SECTION D: Products

**Files:** `lib/api/products.ts` · `actions/products.ts`  
**Relevant screens:** `/products` · `/products/new` · `/products/[id]/edit` · `/products/import`

---

### D.1 Get All Products (with stock)

**Endpoint:** `GET /tenants/{tenantId}/products?page=1&limit=50`  
**Also needed:** `GET /tenants/{tenantId}/stock/outlet/{outletId}` for stock values  
**Mechanism:** Async server component

```typescript
// lib/api/products.ts
export async function getProducts(tenantId: string, page = 1, limit = 50) {
  const api = createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/products`, {
    params: { page, limit },
  });
  return data; // PaginatedResponse<Product>
}

export async function getOutletStock(tenantId: string, outletId: string) {
  const api = createServerAxios();
  const { data } = await api.get(
    `/tenants/${tenantId}/stock/outlet/${outletId}`,
  );
  return data; // StockRecord[]
}
```

**Page pattern:**

```typescript
// app/(dashboard)/products/page.tsx
export default async function ProductsPage() {
  const tenantId = getTenantIdFromCookies(); // helper that reads cookie
  const outletId = getDefaultOutletId(); // helper that reads from stored outlet
  const [products, stock] = await Promise.all([
    getProducts(tenantId),
    getOutletStock(tenantId, outletId),
  ]);
  // Merge stock into products
  const productsWithStock = mergeStockIntoProducts(products.data, stock);
  return <ProductsScreen products={productsWithStock} />;
}
```

**Note:** To get tenantId in a server component (not server action), use:

```typescript
import { cookies } from "next/headers";
const tenantId = cookies().get("tenant_id")?.value!;
```

- [x] Create `getProducts()` in `lib/api/products.ts`
- [x] Create `getOutletStock()` in `lib/api/products.ts`
- [x] Create `mergeStockIntoProducts()` utility in `lib/utils/products.ts`
- [x] Call both in `app/(dashboard)/products/page.tsx` with `Promise.all`
- [x] Pass merged data to `ProductsScreen` component
- [x] Handle deleted products filter via search params (pass `includeDeleted=true` query param to fetch deleted products)

---

### D.2 Search Products (for Billing Screen)

**Endpoint:** `GET /tenants/{tenantId}/products/search?q={query}`  
**Mechanism:** Client component (real-time search in billing screen)  
**Use:** Billing page product search uses `clientAxios` directly (not a server action — it needs to be real-time)

```typescript
// features/billing/use-product-search.ts
"use client";
import { useCallback, useState } from "react";
import clientAxios from "@/lib/axios/client";
import { useDebounce } from "@/hooks/use-debounced-value";

export function useProductSearch(tenantId: string) {
  const [results, setResults] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await clientAxios.get(
          `/tenants/${tenantId}/products/search`,
          { params: { q: query } },
        );
        setResults(data);
      } finally {
        setLoading(false);
      }
    },
    [tenantId],
  );

  return { results, loading, search };
}
```

₹

- [x] Create `useProductSearch` hook in `features/billing/use-product-search.ts`
- [x] Wire to billing screen search input (BillingSearch component uses hook with tenantId from localStorage)
- [x] Debounce search input by 300ms
- [x] Show loading state while fetching (spinner shown during API request)
- [x] Show stock quantity inline in search results (displayed as formatted stock or "Out of Stock" badge)

---

### D.3 Get Single Product

**Endpoint:** `GET /tenants/{tenantId}/products/{productId}`  
**Mechanism:** Async server component (edit page)

```typescript
// lib/api/products.ts
export async function getProduct(
  tenantId: string,
  productId: string,
): Promise<Product> {
  const api = createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/products/${productId}`);
  return data;
}
```

- [x] Create `getProduct()` in `lib/api/products.ts`
- [x] Call in `app/(dashboard)/products/[id]/edit/page.tsx`
- [x] Pass product data to `EditProductForm` component

---

### D.4 Create Product

**Endpoint:** `POST /tenants/{tenantId}/products`  
**Request:** `{ name, basePrice, gstRate, deficitThreshold }`  
**Response 201:** `Product`  
**Mechanism:** Server Action  
**revalidatePath:** `/products`

**Zod Schema:**

```typescript
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  basePrice: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .multipleOf(0.01, "Price can have at most 2 decimal places"),
  gstRate: z.coerce
    .number()
    .refine((v) => [0, 5, 12, 18, 28].includes(v), "Select a valid GST rate"),
  deficitThreshold: z.coerce
    .number({ invalid_type_error: "Threshold must be a number" })
    .int("Threshold must be a whole number")
    .min(1, "Threshold must be at least 1")
    .default(10),
  openingStock: z.coerce
    .number()
    .int("Opening stock must be a whole number")
    .min(0, "Opening stock cannot be negative")
    .default(0),
});
```

**Server Action:**

```typescript
// actions/products.ts
"use server";
export const createProductAction = validatedAction(
  createProductSchema,
  async (data) => {
    try {
      const tenantId = getTenantId();
      const api = createServerAxios();
      // Create product
      const { data: product } = await api.post(
        `/tenants/${tenantId}/products`,
        {
          name: data.name,
          basePrice: data.basePrice,
          gstRate: data.gstRate,
          deficitThreshold: data.deficitThreshold,
        },
      );
      // Set opening stock if > 0
      if (data.openingStock > 0) {
        const outletId = cookies().get("outlet_id")?.value;
        await api.patch(
          `/tenants/${tenantId}/products/${product._id}/stock`,
          {
            quantity: data.openingStock,
          },
          { params: { outletId } },
        );
      }
      revalidatePath("/products");
      return {
        success: "Product created successfully",
        productId: product._id,
      };
    } catch (err: any) {
      return { error: err.message };
    }
  },
);
```

**Note:** Opening stock: the API for setting stock uses `PATCH /tenants/{tenantId}/products/{productId}/stock?outletId={outletId}`. Call this after product creation only if openingStock > 0.

- [x] Create `createProductSchema` in `actions/products.ts`
- [x] Create `createProductAction` server action
- [x] Handle opening stock: call stock update API if openingStock > 0
- [x] Wire form in `features/products/create-product-form.tsx` using `useActionState`
- [x] Call `revalidatePath('/products')` after success
- [x] Redirect to `/products` after success (`redirect('/products')` inside action)
- [x] Show inline errors per field

---

### D.5 Update Product

**Endpoint:** `PUT /tenants/{tenantId}/products/{productId}`  
**Request:** `{ name?, basePrice?, gstRate?, deficitThreshold? }`  
**Response 200:** `Product`  
**Mechanism:** Server Action  
**revalidatePath:** `/products` and `/products/${productId}/edit`

**Zod Schema:** Same as createProductSchema minus `openingStock`. All fields optional (partial update).

```typescript
const updateProductSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  basePrice: z.coerce.number().positive().optional(),
  gstRate: z.coerce
    .number()
    .refine((v) => [0, 5, 12, 18, 28].includes(v))
    .optional(),
  deficitThreshold: z.coerce.number().int().min(1).optional(),
});
```

**Note:** `productId` is passed as a hidden input in the form.

- [x] Create `updateProductSchema` + `updateProductAction` in `actions/products.ts`
- [x] Pass `productId` as hidden input in edit form
- [x] Use `EditProductForm` component with pre-populated values via `defaultValue`
- [x] Call `revalidatePath('/products')` and `revalidatePath('/products/[id]/edit')` after success
- [x] Show success toast and use `router.refresh()` to reload page

---

### D.6 Delete Product (Soft Delete)

**Endpoint:** `DELETE /tenants/{tenantId}/products/{productId}`  
**Response 204:** no body  
**Mechanism:** Server Action  
**revalidatePath:** `/products`

**Zod Schema:**

```typescript
const deleteProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});
```

**Important rule from PRD:** Cannot delete a product with PENDING deficit records. The API returns a 400 in this case. Show error: "This product has unresolved deficits. Resolve them before deleting."

- [x] Create `deleteProductSchema` + `deleteProductAction` in `actions/products.ts`
- [x] Delete button in `EditProductForm` with trash icon
- [x] Handle 400 error: show specific "unresolved deficits" message
- [x] Confirmation dialog with product name in description
- [x] Display delete error state alongside update errors
- [x] Call `revalidatePath('/products')` after success

---

### D.7 Restore Product

**Endpoint:** `POST /tenants/{tenantId}/products/{productId}/restore`  
**Response 200:** `Product`  
**Mechanism:** Server Action  
**revalidatePath:** `/products`

**Zod Schema:**

```typescript
const restoreProductSchema = z.object({
  productId: z.string().min(1),
});
```

- [x] Create `restoreProductSchema` + `restoreProductAction` in `actions/products.ts`
- [x] Show "Restore" button only for deleted products (when `includeDeleted=true` via search params)
- [x] Call `revalidatePath('/products')` after success

---

### D.8 Update Stock (Manual)

**Endpoint:** `PATCH /tenants/{tenantId}/products/{productId}/stock?outletId={outletId}`  
**Request:** `{ quantity: number }` (the new absolute quantity, not a delta)  
**Response 200:** `{ data: StockRecord }`  
**Mechanism:** Server Action  
**revalidatePath:** `/products`

**Zod Schema:**

```typescript
const updateStockSchema = z.object({
  productId: z.string().min(1),
  outletId: z.string().min(1),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
});
```

- [x] Create `updateStockSchema` + `updateStockAction` in `actions/products.ts`
- [x] Add "Update Stock" button (Package icon) on product list row for non-deleted products
- [x] Show current stock value pre-filled in the dialog input
- [x] Pass productId and outletId to the action
- [x] Show product name in dialog context: "Update stock for [productName]"
- [x] Call `revalidatePath('/products')` after success

---

### D.9 CSV Import

**Endpoint:** `POST /products/import` (multipart/form-data)  
**Request:** FormData with file field  
**Response 201:** `{ imported: number, skipped: number, errors: { row: number, reason: string }[] }`  
**Response 400:** file validation error  
**Mechanism:** Server Action (FormData with file)  
**revalidatePath:** `/products`

**Note:** CSV import uses a different endpoint format (no tenantId in path — it reads from auth token).

**File validation (client-side before submit):**

- Only `.csv` extension
- Max 5 MB
- Show error immediately if violated without submitting

**Server Action (no validatedAction HOF — file upload requires special handling):**

```typescript
// actions/products.ts
export async function importProductsAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Please select a CSV file" };
  if (!file.name.endsWith(".csv"))
    return { error: "Only .csv files are accepted" };
  if (file.size > 5 * 1024 * 1024)
    return { error: "File size must be under 5 MB" };

  try {
    const api = createServerAxios();
    const uploadData = new FormData();
    uploadData.append("file", file);
    const { data } = await api.post("/products/import", uploadData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    revalidatePath("/products");
    return {
      success: `Imported ${data.imported} products.`,
      imported: data.imported,
      skipped: data.skipped,
      errors: data.errors,
    };
  } catch (err: any) {
    return { error: err.message };
  }
}
```

**CSV Template Download:**

```typescript
// Endpoint: GET /products/import/template
// Handle as a direct link — not a server action
// Add a regular <a> tag pointing to the API URL with auth token in header
// Or create a client-side download handler
```

- [x] Create `importProductsAction` in `actions/products.ts`
- [x] Client-side file validation (type and size) before form submit
- [x] Wire upload area in `app/(dashboard)/products/import/page.tsx`
- [x] Show import results: success count, skip count, per-row error list
- [x] Handle template download: fallback CSV generation with blob response
- [x] Call `revalidatePath('/products')` after success

---

## SECTION E: Invoices

**Files:** `lib/api/invoices.ts` · `actions/invoices.ts`  
**Relevant screens:** `/` (billing) · `/invoices` · `/invoices/[id]`

---

### E.1 Get Invoices (with filters)

**Endpoint:** `GET /tenants/{tenantId}/invoices?page=1&limit=20&dateFrom=&dateTo=&invoiceNumber=&paymentMethod=&gstEnabled=&outletId=&productId=`  
**Mechanism:** Async server component

```typescript
// lib/api/invoices.ts
export interface InvoiceFilters {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  invoiceNumber?: string;
  paymentMethod?: "CASH" | "CARD" | "UPI";
  gstEnabled?: boolean;
  outletId?: string;
  productId?: string;
}

export async function getInvoices(
  tenantId: string,
  filters: InvoiceFilters = {},
) {
  const api = createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/invoices`, {
    params: filters,
  });
  return data; // PaginatedResponse<Invoice>
}
```

**Filters from URL searchParams:**

```typescript
// app/(dashboard)/invoices/page.tsx
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { page?: string; dateFrom?: string; dateTo?: string; invoiceNumber?: string; paymentMethod?: string; gstEnabled?: string; productId?: string };
}) {
  const tenantId = cookies().get('tenant_id')?.value!;
  const invoices = await getInvoices(tenantId, {
    page: Number(searchParams.page) || 1,
    limit: 20,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    invoiceNumber: searchParams.invoiceNumber,
    paymentMethod: searchParams.paymentMethod as any,
    gstEnabled: searchParams.gstEnabled === 'true' ? true : searchParams.gstEnabled === 'false' ? false : undefined,
    productId: searchParams.productId,
  });
  return <InvoicesScreen invoices={invoices} />;
}
```

**Filters UI:** Filters are applied by updating URL searchParams (Next.js `router.push` with new params). This keeps filter state in the URL and enables deep-linking. The filter bar is a client component that pushes new searchParams. The page re-renders server-side with new data.

- [x] Create `getInvoices()` with `InvoiceFilters` in `lib/api/invoices.ts`
- [x] Call in `app/(dashboard)/invoices/page.tsx` using `searchParams`
- [x] Create `InvoiceFiltersBar` client component (pushes URL params on change)
- [x] All 6 filter types wired to URL params:
  - [x] Date range (dateFrom / dateTo)
  - [x] Invoice number search
  - [x] Payment method dropdown
  - [x] GST type toggle (all / GST only / non-GST only)
  - [x] Product search field
- [x] Pagination controls wired to `page` URL param

---

### E.2 Get Invoice Detail

**Endpoint:** `GET /tenants/{tenantId}/invoices/{invoiceId}`  
**Mechanism:** Async server component

```typescript
// lib/api/invoices.ts
export async function getInvoice(
  tenantId: string,
  invoiceId: string,
): Promise<Invoice> {
  const api = createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/invoices/${invoiceId}`);
  return data;
}
```

- [x] Create `getInvoice()` in `lib/api/invoices.ts`
- [x] Call in `app/(dashboard)/invoices/[id]/page.tsx`
- [x] Show full invoice detail: items, totals, customer info, GST breakdown
- [x] Show GST section only when `isGstInvoice === true`
- [x] Show "Back to invoices" navigation

---

### E.3 Create Invoice (Two-Phase — Most Complex)

**Endpoint:** `POST /tenants/{tenantId}/invoices`  
**Request:** (see below)  
**Response 201:** Invoice created (all stock sufficient)  
**Response 200:** Invoice created (idempotent duplicate)  
**Response 409:** Stock insufficient — returns `insufficientItems` array  
**Response 403:** Override blocked by deficit threshold  
**Mechanism:** This flow is implemented with **server actions + Zustand state orchestration**. Billing UI calls store actions, store actions call `submitInvoiceAction` / `submitInvoiceWithOverridesAction` from `actions/invoices.ts`, and the UI transitions through `phase` states (`submitting`, `stock_conflict`, `success`, `error`).

**Request payload:**

```typescript
interface CreateInvoicePayload {
  clientGeneratedId: string; // UUID v4
  outletId: string;
  paymentMethod: "CASH" | "CARD" | "UPI";
  customerName?: string;
  customerPhone?: string;
  gstEnabled: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    override?: boolean; // true only in second attempt
  }>;
}
```

**Current Implementation Shape:**

```typescript
// stores/invoice-store.ts
// 1) submitInvoice(gstEnabled, overrides?) builds payload with stable clientGeneratedId
// 2) calls submitInvoiceAction (phase 1) or submitInvoiceWithOverridesAction (phase 2)
// 3) sets phase: "success" | "stock_conflict" | "error"

// actions/invoices.ts
// submitInvoiceAction(payload): handles 201/200 success, 409 stock_conflict, 403 error
// submitInvoiceWithOverridesAction(payload): retry path with override flags

// features/invoices/invoice-stock-conflict-modal.tsx
// user decisions: "use-available" | "override" | "remove"
// confirm returns decisions map to billing workspace
```

**Billing Screen Finalization Flow:**

1. User clicks "Finalize Invoice" → `submitInvoice(cartItems, ...)` called
2. If 201/200 → clear invoice draft/cart state and show success toast
3. If 409 → `phase === 'stock_conflict'` → show `<InsufficientStockModal>`
4. Modal: user makes decisions per item (adjust / override / remove)
5. User clicks "Confirm" → `submitInvoice(cartItems, ...)` called again with same `clientGeneratedId` and `overrides` map
6. Server processes with override flags

**InsufficientStockModal:** Client component showing all insufficient items with their options. Manages per-item decision state. Confirms only when all items have a decision.

- [x] Install `uuid` package: `npm install uuid @types/uuid`
- [x] Create `useInvoiceCreation` hook in `features/billing/use-invoice-creation.ts` (store-backed compatibility wrapper)
- [x] Wire "Finalize Invoice" button to `submitInvoice`
- [x] Show loading spinner when `phase === 'submitting'`
- [x] Show `<InsufficientStockModal>` when `phase === 'stock_conflict'`
- [x] Create `InsufficientStockModal` client component:
  - [x] Show each insufficient item with product name, requested qty, available qty
  - [x] Per-item option A: "Use available qty" (or "Remove" if available = 0)
  - [x] Per-item option B: "Sell anyway" — disabled if threshold exceeded
  - [x] Per-item option C: "Remove from bill"
  - [x] "Confirm" button gated by valid resolution state
  - [x] "Cancel" button dismisses modal, returns to billing
  - [x] On confirm: call `submitInvoice` with override decisions map
- [ ] On success:
  - [x] Clear invoice/cart draft state
  - [ ] Navigate to `/invoices/${invoice.invoiceId}`
  - [ ] If `abbreviationsLocked` in response: update stored tenant to lock abbreviations
- [x] On error: show error message, keep cart intact

---

## SECTION F: Deficits

**Files:** `lib/api/deficits.ts` · `actions/deficits.ts`  
**Relevant screen:** `/deficits`

---

### F.1 Get Deficits Grouped by Product

**Endpoint:** `GET /tenants/{tenantId}/deficits/grouped-by-product`  
**Mechanism:** Async server component

```typescript
// lib/api/deficits.ts
export async function getDeficitsGroupedByProduct(
  tenantId: string,
): Promise<DeficitGroup[]> {
  const api = createServerAxios();
  const { data } = await api.get(
    `/tenants/${tenantId}/deficits/grouped-by-product`,
  );
  return data;
}
```

- [x] Create `getDeficitsGroupedByProduct()` in `lib/api/deficits.ts`
- [x] Call in `app/(dashboard)/deficits/page.tsx`
- [x] Pass data to `DeficitsScreen` component
- [x] Show empty state if no pending deficits

---

### F.2 Get Deficits with Status Filter (for filtering)

**Endpoint:** `GET /tenants/{tenantId}/deficits/with-status?status=PENDING&page=1&limit=20`  
**Mechanism:** Async server component (alternative view if needed)

- [x] Create `getDeficitsWithStatus()` in `lib/api/deficits.ts`
- [x] Use when detailed paginated deficit list is needed

---

### F.3 Resolve Deficit — Stock Addition (FIFO)

**Endpoint:** `PATCH /tenants/{tenantId}/deficits/by-product/{productId}/resolve-stock-addition`  
**Request:** `{ quantity: number, notes?: string }`  
**Response 200:** `{ resolved: number, totalResolved: number, remainingQuantity: number }`  
**Mechanism:** Server Action  
**revalidatePath:** `/deficits` and `/products`

**Behavior:** This resolves deficits FIFO (oldest first). It also increases the stock by `quantity`. The `remainingQuantity` in the response tells how much deficit is still unresolved.

**Zod Schema:**

```typescript
const resolveStockAdditionSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});
```

- [x] Create `resolveStockAdditionSchema` + `resolveStockAdditionAction` in `actions/deficits.ts`
- [x] Trigger from "Resolve — Stock received" button in deficit resolution panel
- [x] Show quantity input: "How many units did you receive?"
- [x] Show result: `resolved` count and whether `remainingQuantity > 0`
- [x] Call `revalidatePath('/deficits')` and `revalidatePath('/products')`

---

### F.4 Resolve Deficit — Adjustment (Write-off)

**Endpoint:** `PATCH /tenants/{tenantId}/deficits/by-product/{productId}/resolve-adjustment`  
**Request:** `{ reason: 'DAMAGE' | 'LOSS' | 'CORRECTION', notes?: string }`  
**Response 200:** `{ resolved: number, totalResolved: number }`  
**Mechanism:** Server Action  
**revalidatePath:** `/deficits`

**Behavior:** Marks ALL pending deficits for this product as resolved. Does NOT change stock. Requires a reason.

**Zod Schema:**

```typescript
const resolveAdjustmentSchema = z.object({
  productId: z.string().min(1),
  reason: z.enum(["DAMAGE", "LOSS", "CORRECTION"], {
    errorMap: () => ({ message: "Please select a reason" }),
  }),
  notes: z.string().optional(),
});
```

- [x] Create `resolveAdjustmentSchema` + `resolveAdjustmentAction` in `actions/deficits.ts`
- [x] Trigger from "Mark as adjustment" button
- [x] Show reason selector: Damage / Loss / Correction
- [x] Call `revalidatePath('/deficits')`

---

## SECTION G: Billing Screen — Draft State (IndexedDB)

The billing screen manages draft state client-side in IndexedDB. This is NOT an API integration — it is client-side persistence. However, it interacts with the invoice creation API.

Implementation note: this project uses Zustand `persist` + a custom IndexedDB adapter (`idb`) instead of direct `saveDraft/loadDraft/clearDraft` helper functions.

### G.1 IndexedDB Draft Management

Create `lib/draft-store.ts`:

```typescript
"use client";
// Simple IndexedDB wrapper for single-draft persistence (MVP 1)
const DB_NAME = "pos-drafts";
const STORE_NAME = "drafts";
const DRAFT_KEY = "current-draft";

export interface DraftBill {
  id: string;
  tenantId: string;
  outletId: string;
  items: DraftItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: "CASH" | "CARD" | "UPI" | "";
  createdAt: string;
  updatedAt: string;
}

export interface DraftItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

// Open DB
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      (e.target as IDBOpenDBRequest).result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(draft: DraftBill): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(draft, DRAFT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDraft(): Promise<DraftBill | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearDraft(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

- [x] Create persisted billing store + IndexedDB adapter (`stores/billing-store.ts` + `lib/indexedDbStorage.ts`)
- [x] Create `useBillingCart` hook in `features/billing/use-billing-cart.ts` exposing `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- [x] Wire billing workspace/components to use persisted billing draft store
- [x] After successful invoice creation: call `clearCart()`

---

### G.2 Stock Refresh on Billing Screen

**Endpoint:** `GET /tenants/{tenantId}/stock/outlet/{outletId}`  
**Mechanism:** Client component, triggered by "Refresh stock" button  
**Use:** Update locally displayed stock values without page reload

```typescript
// features/billing/use-stock-refresh.ts
export function useStockRefresh(tenantId: string, outletId: string) {
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { data } = await clientAxios.get(
        `/tenants/${tenantId}/stock/outlet/${outletId}`,
      );
      const map: Record<string, number> = {};
      data.forEach((s: StockRecord) => {
        map[s.productId] = s.quantity;
      });
      setStockMap(map);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);
  return { stockMap, refresh, refreshing };
}
```

- [x] Create `useStockRefresh` hook in `features/billing/use-stock-refresh.ts`
- [x] Wire "Refresh stock" button on billing screen
- [x] Show refreshing spinner on button when `refreshing === true`
- [x] Use `stockMap` to display stock on product search results

---

## SECTION H: Navigation — GST Toggle

The GST toggle in the nav persists to the server via `PATCH /settings/gst`. It must reflect the current `gstEnabled` value from the tenant.

### H.1 GST Toggle Integration

**Read:** `gstEnabled` is fetched in the dashboard layout from `GET /settings` or from the stored tenant object.  
**Write:** Toggle triggers `PATCH /settings/gst` immediately (not a form submit).

**Pattern (nav GST toggle is a client component):**

```typescript
'use client';
// features/shell/gst-toggle.tsx
import clientAxios from '@/lib/axios/client';

export function GstToggle({ initialEnabled, tenantId }: { initialEnabled: boolean; tenantId: string }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const newValue = !enabled;
    setEnabled(newValue); // optimistic
    setLoading(true);
    try {
      await clientAxios.patch('/settings/gst', {
        gstEnabled: newValue,
        gstNumber: '', // keep existing value — fetch from stored tenant
      });
    } catch {
      setEnabled(!newValue); // revert on error
    } finally {
      setLoading(false);
    }
  };

  return <Toggle checked={enabled} onChange={toggle} disabled={loading} label="GST" />;
}
```

**Important:** The `PATCH /settings/gst` requires both `gstNumber` and `gstEnabled`. Read the current `gstNumber` from the stored tenant object (localStorage) when sending the toggle request.

- [ ] Create `GstToggle` client component in `features/shell/gst-toggle.tsx`
- [ ] Read `tenant.gstEnabled` from cookie/localStorage to set initial state
- [ ] Read `tenant.gstNumber` from localStorage to include in PATCH request
- [ ] Optimistic update on toggle click
- [ ] Revert on failure
- [ ] Pass `gstEnabled` state to billing cart calculation logic

---

## 4. Integration Sequence (Build Order)

Follow this order. Each step depends on the previous being complete.

1. **Foundation** (Section 2): axios instances, safe-action, types, middleware, env var
2. **Auth** (Section A): signup, login, logout — cannot test anything else without auth
3. **Onboarding** (Section B): required immediately after signup
4. **Settings GET** (Section C.1): needed for nav to show correct state
5. **GST Toggle** (Section H): needed on billing screen
6. **Products GET** (Section D.1, D.2, D.3): needed before billing
7. **Products mutations** (Section D.4–D.9): create, edit, delete, restore, stock update, CSV
8. **Billing — Draft** (Section G): IndexedDB cart, no API needed
9. **Billing — Invoice creation** (Section E.3): most complex, requires products and draft working
10. **Invoices list and detail** (Section E.1, E.2): read-only, straightforward
11. **Deficits** (Section F): depends on invoices (linked invoice IDs)
12. **Settings mutations** (Section C.2, C.3): update business, GST, password
13. **Forgot/Reset password** (Section A.4, A.5): last — important but not on critical path

---

## 5. Common Patterns Reference

### Pattern: Server Action with revalidatePath + redirect

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const someAction = validatedAction(schema, async (data) => {
  try {
    const tenantId = getTenantId();
    const api = createServerAxios();
    await api.post(`/tenants/${tenantId}/some-endpoint`, data);
    revalidatePath("/some-page");
    // Use redirect inside action for navigation after mutation:
    redirect("/some-page");
  } catch (err: any) {
    return { error: err.message };
  }
  // redirect() throws internally — no return needed after it
});
```

### Pattern: useActionState in client form

```typescript
'use client';
import { useActionState } from 'react';

const [state, formAction, isPending] = useActionState(someAction, { error: '', success: '' });

return (
  <form action={formAction}>
    <input name="fieldName" />
    {state.error && <p className="text-red-600">{state.error}</p>}
    {state.success && <p className="text-green-600">{state.success}</p>}
    <button type="submit" disabled={isPending}>
      {isPending ? 'Saving...' : 'Save'}
    </button>
  </form>
);
```

### Pattern: Hidden input for IDs in server actions

```typescript
// When productId is not in the URL but needed in the action:
<form action={deleteProductAction}>
  <input type="hidden" name="productId" value={product._id} />
  <button type="submit">Delete</button>
</form>
```

### Pattern: Reading cookies in server component (not server action)

```typescript
import { cookies } from "next/headers";

export default async function SomePage() {
  const tenantId = cookies().get("tenant_id")?.value;
  if (!tenantId) redirect("/login");
  // use tenantId for API calls
}
```

### Pattern: Error boundary for async pages

```typescript
// app/(dashboard)/products/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Pattern: Loading skeleton for async pages

```typescript
// app/(dashboard)/products/loading.tsx
export default function Loading() {
  return <ProductsScreenSkeleton />;
}
```

---

## 6. API Endpoints Not Used in MVP 1

The following endpoints exist in the swagger spec but are NOT used in MVP 1 frontend. Do not integrate them:

| Endpoint                                                  | Reason                                        |
| --------------------------------------------------------- | --------------------------------------------- |
| `GET /tenants`                                            | Admin only                                    |
| `POST /tenants`                                           | Admin only (signup used instead)              |
| `PUT /tenants/{id}`                                       | Use settings endpoints instead                |
| `DELETE /tenants/{id}`                                    | Admin only                                    |
| `GET /tenants/email/{email}`                              | Admin only                                    |
| `POST /tenants/{id}/change-password`                      | Use settings endpoint instead                 |
| `POST /tenants/{id}/lock-abbr`                            | Called internally by invoice creation API     |
| `POST /password-reset/send-reset-email`                   | Use `POST /auth/forgot-password` instead      |
| `POST /password-reset/verify-token`                       | Not exposed as a user action                  |
| `POST /password-reset/reset-password`                     | Use `POST /auth/reset-password` instead       |
| `POST /password-reset/cleanup-expired`                    | Admin only                                    |
| `POST /tenants/{tenantId}/outlets`                        | MVP 4                                         |
| `GET /tenants/{tenantId}/outlets`                         | MVP 4                                         |
| `PUT /tenants/{tenantId}/outlets/{outletId}`              | MVP 4                                         |
| `DELETE /tenants/{tenantId}/outlets/{outletId}`           | MVP 4                                         |
| `POST /tenants/{tenantId}/outlets/{outletId}/set-default` | MVP 4                                         |
| `GET /tenants/{tenantId}/deficits/{deficitId}`            | Detail not needed in MVP 1 UI                 |
| `GET /tenants/{tenantId}/deficits/product/{productId}`    | Grouped endpoint used instead                 |
| `POST /tenants/{tenantId}/deficits/{deficitId}/resolve`   | Use bulk-by-product endpoints instead         |
| `GET /tenants/{tenantId}/stock-audit`                     | UI deferred to future MVP                     |
| `GET /tenants/{tenantId}/stock-audit/**`                  | UI deferred to future MVP                     |
| `POST /tenants/{tenantId}/stock`                          | Stock created automatically on product create |
| `PUT /tenants/{tenantId}/stock/{stockId}`                 | Use product stock PATCH instead               |
| `DELETE /tenants/{tenantId}/stock/{stockId}`              | Not a user-facing action                      |
| `DELETE /tenants/{tenantId}/invoices/{invoiceId}`         | Soft delete not exposed in MVP 1 UI           |
| `GET /health/**`                                          | Internal infrastructure                       |
| `GET /`                                                   | Health check root                             |

---

## 7. Master Checklist (All APIs)

### Section A: Authentication

- [x] A.1 Signup — `POST /auth/signup`
- [x] A.2 Login — `POST /auth/login`
- [x] A.3 Logout — `POST /auth/logout`
- [x] A.4 Forgot Password — `POST /auth/forgot-password`
- [x] A.5 Reset Password — `POST /auth/reset-password`
- [x] A.6 Change Password — `POST /settings/change-password`

### Section B: Onboarding

- [x] B.1 Get Onboarding Status — `GET /onboarding/status`
- [x] B.2 Update Business — `PATCH /onboarding/business`
- [x] B.3 Update Outlet — `PATCH /onboarding/outlet`
- [x] B.4 Update GST — `PATCH /onboarding/gst`
- [x] B.5 Complete Onboarding — `POST /onboarding/complete`

### Section C: Settings

- [x] C.1 Get Settings — `GET /settings`
- [x] C.2 Update Business Settings — `PATCH /settings/business`
- [x] C.3 Update GST Settings — `PATCH /settings/gst`

### Section D: Products

- [x] D.1 Get All Products + Stock — `GET /tenants/{tenantId}/products` + `GET /tenants/{tenantId}/stock/outlet/{outletId}`
- [x] D.2 Search Products — `GET /tenants/{tenantId}/products/search`
- [x] D.3 Get Single Product — `GET /tenants/{tenantId}/products/{productId}`
- [x] D.4 Create Product — `POST /tenants/{tenantId}/products` + stock PATCH
- [x] D.5 Update Product — `PUT /tenants/{tenantId}/products/{productId}`
- [x] D.6 Delete Product — `DELETE /tenants/{tenantId}/products/{productId}`
- [x] D.7 Restore Product — `POST /tenants/{tenantId}/products/{productId}/restore`
- [x] D.8 Update Stock — `PATCH /tenants/{tenantId}/products/{productId}/stock`
- [x] D.9 CSV Import — `POST /products/import` + `GET /products/import/template`

### Section E: Invoices

- [x] E.1 Get Invoices with Filters — `GET /tenants/{tenantId}/invoices`
- [x] E.2 Get Invoice Detail — `GET /tenants/{tenantId}/invoices/{invoiceId}`
- [x] E.3 Create Invoice (Two-Phase) — `POST /tenants/{tenantId}/invoices`

### Section F: Deficits

- [x] F.1 Get Deficits Grouped — `GET /tenants/{tenantId}/deficits/grouped-by-product`
- [x] F.2 Get Deficits with Status — `GET /tenants/{tenantId}/deficits/with-status`
- [x] F.3 Resolve — Stock Addition — `PATCH /tenants/{tenantId}/deficits/by-product/{productId}/resolve-stock-addition`
- [x] F.4 Resolve — Adjustment — `PATCH /tenants/{tenantId}/deficits/by-product/{productId}/resolve-adjustment`

### Section G: Billing (Client-Side)

- [x] G.1 IndexedDB Draft — Zustand persist + IndexedDB adapter
- [x] G.2 Stock Refresh — `GET /tenants/{tenantId}/stock/outlet/{outletId}` (client-side)

### Section H: Navigation

- [ ] H.1 GST Toggle — Frontend-only scope (excluded from API master checklist tracking)

### Foundation (Must complete before any section)

- [x] `lib/safe-action.ts` — `validatedAction` HOF + `ActionState` type
- [x] `lib/axios/server.ts` — server axios instance with auth header
- [x] `lib/axios/client.ts` — client axios instance with localStorage token
- [x] `lib/auth-tokens.ts` — `saveAuthSession`, `clearAuthSession`, `getStoredTenant`, `clearAuthSession` with `outlet_id` cookie
- [x] `lib/get-tenant-id.ts` — `getTenantId()` for server actions
- [x] `lib/types/api.ts` — all API types
- [x] `lib/utils/abbreviation.ts` — `generateAbbreviation()`
- [x] `lib/indexedDbStorage.ts` + `stores/billing-store.ts` — IndexedDB persistence via Zustand
- [ ] `middleware.ts` — route protection
- [ ] `.env.local` — `NEXT_PUBLIC_API_URL`
- [x] `uuid` package installed

---

_End of MVP 1 API Integration Guide_  
_All APIs are listed. All patterns are defined. All edge cases are specified. No ambiguity remains._
