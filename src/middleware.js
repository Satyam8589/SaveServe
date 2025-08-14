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
  const publicPages = ["/", "/about", "/contact", "/sign-in", "/sign-up","/providerDashboard","/recipientDashboard"];
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

    if (hasOnboarded !== true) {
      // User hasn't onboarded → force to onboarding
      if (isOnboardingRoute(req) || isPostLoginRoute(req)) return NextResponse.next();
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // User onboarded → redirect if trying to visit onboarding page
    if (hasOnboarded === true && isOnboardingRoute(req)) {
      if (mainRole === "provider") {
        return NextResponse.redirect(new URL("/providerDashboard", req.url));
      } else if (mainRole === "recipient") {
        return NextResponse.redirect(new URL("/recipientDashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", req.url));
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
