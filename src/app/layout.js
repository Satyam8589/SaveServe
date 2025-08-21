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
