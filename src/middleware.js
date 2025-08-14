// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define route matchers
const isProtectedRoute = createRouteMatcher([
  "/create-listing(.*)",
  "/pickups(.*)",
  "/analytics(.*)",
  "/listings(.*)",
  "/events(.*)",
  "/admin(.*)",
  "/profile(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

const isPostLoginRoute = createRouteMatcher([
  "/post-login(.*)",
  "/sign-up/sso-callback(.*)",
  "/sign-in/sso-callback(.*)",
]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/listings(.*)",
  "/api/profile(.*)",
  "/api/admin(.*)",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/public(.*)",
  "/api/health(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn, sessionClaims } = await auth();
  const currentPath = req.nextUrl.pathname;

  // Handle API routes
  if (currentPath.startsWith("/api/")) {
    if (isPublicApiRoute(req)) return NextResponse.next();
    if (isProtectedApiRoute(req) && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Public pages
  const publicPages = [
    "/",
    "/about",
    "/contact",
    "/sign-in",
    "/sign-up",
    "/providerDashboard",
    "/recipientDashboard",
    "/providerDashboard/listings",
    "/providerDashboard/overview",
  ];
  if (publicPages.includes(currentPath) || currentPath.startsWith("/sign-")) {
    return NextResponse.next();
  }

  // Protected pages
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Onboarding logic
  if (userId) {
    const hasOnboarded = sessionClaims?.publicMetadata?.hasOnboarded;
    const mainRole = sessionClaims?.publicMetadata?.mainRole?.toLowerCase();

    // 🚀 New: If user is onboarded, block onboarding page completely
    if (hasOnboarded === true && isOnboardingRoute(req)) {
      if (mainRole === "PROVIDER") {
        return NextResponse.redirect(new URL("/providerDashboard", req.url));
      } else if (mainRole === "RECIPIENT") {
        return NextResponse.redirect(new URL("/recipientDashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // If not onboarded yet → force onboarding
    if (hasOnboarded !== true) {
      if (!isOnboardingRoute(req) && !isPostLoginRoute(req)) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
