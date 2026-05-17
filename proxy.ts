import { getDefaultOrFirstOutlet } from "@/lib/api/outlets";
import { NextRequest, NextResponse } from "next/server";
import { ROUTES } from "./lib/routes";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];
const ONBOARDING_ROUTES = ["/business", "/outlet", "/gst"];

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const onboardingComplete =
    request.cookies.get("billit_onboarding_complete")?.value === "true";
  const businessCompleted =
    request.cookies.get("billit_onboarding_business")?.value === "true";
  const outletCompleted =
    request.cookies.get("billit_onboarding_outlet")?.value === "true";
  const pathname = request.nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingRoute = ONBOARDING_ROUTES.some((r) =>
    pathname.startsWith(r),
  );

  // Not authenticated: redirect to login (except public routes)
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL(ROUTES.AUTH_LOGIN, request.url));
  }

  // Authenticated on public route: redirect based on onboarding status
  if (token && isPublicRoute) {
    if (!onboardingComplete) {
      return NextResponse.redirect(
        new URL(ROUTES.ONBOARDING_BUSINESS, request.url),
      );
    } else {
      return NextResponse.redirect(new URL(ROUTES.BILLING, request.url));
    }
  }

  // On onboarding route but onboarding already complete: redirect to dashboard
  if (isOnboardingRoute && onboardingComplete) {
    return NextResponse.redirect(new URL(ROUTES.BILLING, request.url));
  }

  // Enforce onboarding step progression via cookies
  if (pathname === ROUTES.ONBOARDING_OUTLET && !businessCompleted) {
    return NextResponse.redirect(
      new URL(ROUTES.ONBOARDING_BUSINESS, request.url),
    );
  }

  if (pathname === ROUTES.ONBOARDING_GST && !outletCompleted) {
    return NextResponse.redirect(
      new URL(ROUTES.ONBOARDING_OUTLET, request.url),
    );
  }

  // Authenticated but trying to access dashboard without completing onboarding
  if (token && !isPublicRoute && !isOnboardingRoute && !onboardingComplete) {
    return NextResponse.redirect(
      new URL(ROUTES.ONBOARDING_BUSINESS, request.url),
    );
  }

  // If user is accessing the billing dashboard, ensure an outlet_id cookie exists.
  // If missing, try to fetch the default/first outlet and set it so the client has an outlet selected.
  const isBillingRoute = pathname === ROUTES.BILLING;
  const existingOutletId = request.cookies.get("outlet_id")?.value;

  if (isBillingRoute && !existingOutletId) {
    try {
      const outlet = await getDefaultOrFirstOutlet();
      if (outlet && outlet._id) {
        const res = NextResponse.next();
        res.cookies.set("outlet_id", outlet._id, {
          maxAge: 7 * 24 * 60 * 60,
          sameSite: "lax",
          path: "/",
        });
        return res;
      }
    } catch (err) {
      // Fall back to continuing without setting cookie
      console.error("Failed to auto-select outlet:", err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
