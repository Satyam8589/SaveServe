// middleware.js
import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define route matchers
const isProtectedRoute = createRouteMatcher([
  "/create-listing(.*)",
  "/pickups(.*)",
  "/listings(.*)",
  "/events(.*)",
  "/admin(.*)",
  "/profile(.*)",
  "/providerDashboard(.*)",
  "/recipientDashboard(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isProfileRoute = createRouteMatcher(["/profile(.*)"]);
const isPendingApprovalRoute = createRouteMatcher(["/pending-approval(.*)"]);

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
  "/api/analytics(.*)",
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
  const isPublicRoute = createRouteMatcher([
    "/",
    "/about",
    "/about/(.*)",
    "/contact",
    "/contact/(.*)",
    "/analytics",
    "/analytics/(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/map",
    "/map(.*)",
    "/pending-approval(.*)", // Allow access to pending approval page
  ]);

  console.log("Current path in middleware:", currentPath);

  if (isPublicRoute(req)) {
    console.log("Matched as public route:", currentPath);
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
      hasOnboarded =
        metadata.hasOnboarded === true || metadata.hasOnboarded === "true";
      hasCompleteProfile =
        metadata.hasCompleteProfile === true ||
        metadata.hasCompleteProfile === "true";
      mainRole = metadata.mainRole;

      // Debug logging
      console.log("Middleware check:", {
        userId,
        currentPath,
        hasOnboarded,
        hasCompleteProfile,
        mainRole,
        approvalStatus: metadata.approvalStatus,
      });
    } catch (error) {
      console.error("Error fetching fresh user data:", error);

      // Fallback to session claims if API call fails
      hasOnboarded =
        sessionClaims?.publicMetadata?.hasOnboarded === true ||
        sessionClaims?.publicMetadata?.hasOnboarded === "true";
      hasCompleteProfile =
        sessionClaims?.publicMetadata?.hasCompleteProfile === true ||
        sessionClaims?.publicMetadata?.hasCompleteProfile === "true";
      mainRole = sessionClaims?.publicMetadata?.mainRole;
      metadata = sessionClaims?.publicMetadata;

      console.log("Using fallback session data:", {
        userId,
        currentPath,
        hasOnboarded,
        hasCompleteProfile,
        mainRole,
        metadata,
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
      console.log(
        "User onboarded but needs profile completion, redirecting to profile..."
      );
      // Force to profile completion if not already there
      if (!isProfileRoute(req)) {
        return NextResponse.redirect(new URL("/profile", req.url));
      }
      // Allow profile page
      return NextResponse.next();
    }

    // Step 3: User has completed profile, now check approval status
    if (hasOnboarded && hasCompleteProfile) {
      console.log("User has completed profile, checking approval status...");

      // Admin users bypass approval system
      if (mainRole === "ADMIN") {
        // Block access to onboarding once completed
        if (isOnboardingRoute(req)) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        // Allow admin access to all routes
        return NextResponse.next();
      }

      // For non-admin users, check approval status for dashboard access
      const isDashboardRoute =
        currentPath.includes("Dashboard") || currentPath === "/dashboard";

      if (isDashboardRoute) {
        // Check user's approval status from Clerk metadata
        let approvalStatus = metadata.approvalStatus;

        // If approval status is not in Clerk metadata, check database as fallback
        if (!approvalStatus) {
          try {
            const response = await fetch(
              `${req.nextUrl.origin}/api/profile?userId=${userId}`
            );
            if (response.ok) {
              const data = await response.json();
              approvalStatus = data.profile?.approvalStatus;

              // Update Clerk metadata with the database status
              if (approvalStatus) {
                try {
                  await client.users.updateUserMetadata(userId, {
                    publicMetadata: {
                      ...metadata,
                      approvalStatus: approvalStatus,
                    },
                  });
                } catch (updateError) {
                  console.warn("Failed to update Clerk metadata:", updateError);
                }
              }
            }
          } catch (dbError) {
            console.error(
              "Error checking database for approval status:",
              dbError
            );
          }
        }

        if (approvalStatus === "APPROVED") {
          console.log("User is approved, allowing dashboard access");
          return NextResponse.next();
        } else {
          // Block access for PENDING, REJECTED, or undefined status
          console.log(
            "User not approved, blocking dashboard access. Status:",
            approvalStatus || "undefined"
          );
          return NextResponse.redirect(new URL("/pending-approval", req.url));
        }
      }

      // Block access to onboarding once completed
      if (isOnboardingRoute(req)) {
        console.log(
          "Blocking onboarding access - redirecting to pending approval"
        );
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }

      // Allow access to pending approval page and profile page
      if (isPendingApprovalRoute(req) || isProfileRoute(req)) {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
