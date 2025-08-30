import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Header from "@/components/header";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import LocationPermissionService from "@/components/LocationPermissionService";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SaveServe",
  description:
    "SaveServe is a smart food redistribution platform that connects food providers with recipients in need, reducing food waste and supporting communities.",
  manifest: "/manifest.json",
  themeColor: "#047857",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SaveServe",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default async function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.svg" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          <meta name="theme-color" content="#047857" />
          {/* Leaflet Routing Machine CSS and JS */}
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              {/* Header Section */}
              <Header />

              <main className="min-h-screen">
                {children}
                <SpeedInsights />
                <Analytics />

                {/* Install button (hidden by default, shown by PWA component) */}
                <button
                  id="install-button"
                  style={{ display: "none" }}
                  className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg z-50"
                >
                  Install App
                </button>
              </main>

              {/* Location Permission Service - Uses native browser prompts */}
              <LocationPermissionService />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
