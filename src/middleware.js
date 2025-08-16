// middleware.js
import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
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
  "/providerDashboard(.*)",
  "/recipientDashboard(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isProfileRoute = createRouteMatcher(["/profile(.*)"]);

const isPostLoginRoute = createRouteMatcher([
  "/post-login(.*)",
  "/sign-up/sso-callback(.*)",
  "/sign-in/sso-callback(.*)",
]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/listings(.*)",
  "/api/profile(.*)",
  "/api/admin(.*)",
  "/api/update-user-metadata(.*)",
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

  // Public pages (only sign-in/sign-up and home)
  const publicPages = [
    "/",
    "/about", 
    "/contact",
    "/sign-in",
    "/sign-up",
  ];
  
  if (publicPages.includes(currentPath) || currentPath.startsWith("/sign-")) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Handle authenticated users
  if (userId) {
    let hasOnboarded, hasCompleteProfile, mainRole, metadata;

    try {
      // Fetch fresh user data from Clerk instead of relying on session claims
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      
      metadata = user.publicMetadata || {};
      hasOnboarded = metadata.hasOnboarded === true || metadata.hasOnboarded === "true";
      hasCompleteProfile = metadata.hasCompleteProfile === true || metadata.hasCompleteProfile === "true";
      mainRole = metadata.mainRole;

      // Debug logging
      console.log("Middleware check (fresh data):", {
        userId,
        currentPath,
        hasOnboarded,
        hasCompleteProfile,
        mainRole,
        metadata,
        sessionMetadata: sessionClaims?.publicMetadata // Compare with session
      });

    } catch (error) {
      console.error("Error fetching fresh user data:", error);
      
      // Fallback to session claims if API call fails
      hasOnboarded = sessionClaims?.publicMetadata?.hasOnboarded === true || sessionClaims?.publicMetadata?.hasOnboarded === "true";
      hasCompleteProfile = sessionClaims?.publicMetadata?.hasCompleteProfile === true || sessionClaims?.publicMetadata?.hasCompleteProfile === "true";
      mainRole = sessionClaims?.publicMetadata?.mainRole;
      metadata = sessionClaims?.publicMetadata;

      console.log("Using fallback session data:", {
        userId,
        currentPath,
        hasOnboarded,
        hasCompleteProfile,
        mainRole,
        metadata
      });
    }

    // Step 1: Check if user needs onboarding
    if (!hasOnboarded) {
      console.log("User needs onboarding, redirecting...");
      // Force to onboarding if not already there
      if (!isOnboardingRoute(req) && !isPostLoginRoute(req)) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
      // Allow onboarding page
      return NextResponse.next();
    }

    // Step 2: User has onboarded, check profile completion
    if (hasOnboarded && !hasCompleteProfile) {
      console.log("User onboarded but needs profile completion, redirecting to profile...");
      // Force to profile completion if not already there
      if (!isProfileRoute(req)) {
        return NextResponse.redirect(new URL("/profile", req.url));
      }
      // Allow profile page
      return NextResponse.next();
    }

    // Step 3: User is fully set up, redirect from onboarding/profile to dashboard
    if (hasOnboarded && hasCompleteProfile) {
      console.log("User fully set up, handling dashboard redirects...");
      // Block access to onboarding once completed
      if (isOnboardingRoute(req)) {
        const roleBasedRedirect = getRoleBasedDashboard(mainRole);
        console.log("Blocking onboarding access, redirecting to:", roleBasedRedirect);
        return NextResponse.redirect(new URL(roleBasedRedirect, req.url));
      }

      // Redirect from profile to dashboard if profile is complete (optional)
      if (currentPath === "/profile" && !currentPath.includes("/profile/")) {
        const roleBasedRedirect = getRoleBasedDashboard(mainRole);
        console.log("Redirecting from profile to dashboard:", roleBasedRedirect);
        return NextResponse.redirect(new URL(roleBasedRedirect, req.url));
      }
    }
  }

  return NextResponse.next();
});

// Helper function to determine dashboard based on role
function getRoleBasedDashboard(mainRole) {
  const role = mainRole?.toLowerCase();
  if (role === "provider") {
    return "/providerDashboard";
  } else if (role === "recipient") {
    return "/recipientDashboard";
  }
  return "/onboarding"; // fallback
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};