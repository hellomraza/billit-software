import { NextRequest, NextResponse } from "next/server";
import { ROUTES } from "./lib/routes";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];
const ONBOARDING_ROUTES = ["/business", "/outlet", "/gst"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const onboardingComplete =
    request.cookies.get("billit_onboarding_complete")?.value === "true";
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

  // Authenticated but trying to access dashboard without completing onboarding
  if (token && !isPublicRoute && !isOnboardingRoute && !onboardingComplete) {
    return NextResponse.redirect(
      new URL(ROUTES.ONBOARDING_BUSINESS, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
