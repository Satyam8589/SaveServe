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
  "/dashboard(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

const isPostLoginRoute = createRouteMatcher([
  "/post-login(.*)",
  "/sign-up/sso-callback(.*)",
  "/sign-in/sso-callback(.*)",
]);

// Only protect API routes that you want the middleware to check
const isProtectedApiRoute = createRouteMatcher([
  "/api/listings(.*)",
  "/api/profile(.*)",
  "/api/admin(.*)",
  // Do NOT include /api/update-user-metadata here
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
    // Let backend API handle auth for other routes
    return NextResponse.next();
  }

  // Public pages
  const publicPages = ["/", "/about", "/contact", "/sign-in", "/sign-up"];
  if (publicPages.includes(currentPath) || currentPath.startsWith("/sign-")) {
    return NextResponse.next();
  }

  // Protected app pages
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Onboarding logic
  if (userId) {
    const hasOnboarded = sessionClaims?.publicMetadata?.hasOnboarded;

    if (hasOnboarded !== true) {
      if (isOnboardingRoute(req) || isPostLoginRoute(req)) return NextResponse.next();
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    if (hasOnboarded === true && isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Apply to all pages and API routes, except static files
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
