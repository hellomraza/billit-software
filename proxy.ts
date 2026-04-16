import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get auth and onboarding state from cookies/headers (since we're using localStorage client-side,
  // we'll check via headers that can be set by the client)
  const authCookie = request.cookies.get("billit_auth")?.value;
  const onboardingCookie = request.cookies.get(
    "billit_onboarding_complete",
  )?.value;

  // Routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Routes that require authentication
  const protectedRoutes = ["/products", "/invoices", "/deficits", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Onboarding routes that require auth but not onboarding completion
  const onboardingRoutes = ["/business", "/outlet", "/gst"];
  const isOnboardingRoute = onboardingRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // If accessing public routes but authenticated, redirect based on onboarding status
  if (isPublicRoute && authCookie === "true") {
    if (onboardingCookie === "true") {
      return NextResponse.redirect(new URL("/", request.url));
    } else {
      return NextResponse.redirect(new URL("/business", request.url));
    }
  }

  // If accessing protected routes without auth, redirect to login
  if (isProtectedRoute && authCookie !== "true") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing onboarding routes without auth, redirect to login
  if (isOnboardingRoute && authCookie !== "true") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing onboarding routes but already onboarded, redirect to dashboard
  if (isOnboardingRoute && onboardingCookie === "true") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isOnboardingRoute) {
    const businessCompleted = request.cookies.get(
      "billit_onboarding_business",
    )?.value;
    const outletCompleted = request.cookies.get(
      "billit_onboarding_outlet",
    )?.value;
    // Cannot access outlet step if business is not completed
    if (pathname.startsWith("/outlet") && businessCompleted !== "true") {
      return NextResponse.redirect(new URL("/business", request.url));
    }

    // Cannot access GST step if outlet is not completed
    if (pathname.startsWith("/gst") && outletCompleted !== "true") {
      return NextResponse.redirect(new URL("/outlet", request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
