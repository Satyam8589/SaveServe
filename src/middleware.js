import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/create-listing(.*)",   // Food providers create new listing
  "/pickups(.*)",          // Receivers see claimed food
  "/analytics(.*)",        // Admin/Moderator dashboard
  "/events(.*)",           // Event management
  "/admin(.*)",            // Admin-only
  "/profile(.*)",          // User profile page
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If no user and trying to access a protected route, redirect to sign in
  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
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
