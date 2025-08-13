import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/create-listing(.*)",   // Food providers create new listing
  "/pickups(.*)",          // Receivers see claimed food
  "/analytics(.*)",        // Admin/Moderator dashboard
  "/listings(.*)",         // General listings page
  "/events(.*)",           // Event management
  "/admin(.*)",            // Admin-only
  "/profile(.*)",          // User profile page
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn, sessionClaims } = await auth();

  // If no user and trying to access a protected route → redirect to Sign In
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If user is logged in, but hasn't onboarded → redirect to onboarding
  const hasOnboarded = sessionClaims?.publicMetadata?.hasOnboarded;
  if (userId && !hasOnboarded && req.nextUrl.pathname !== "/onboarding") {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
