import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { Providers } from "./providers";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import NotificationsInitializer from "@/components/NotificationsInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Smart food",
  description: "Connect with doctors anytime, anywhere",
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
        
        </head>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              <NotificationsInitializer />
              {/* Header Section */}
              <Header />

              <main className="min-h-screen">
                {children}
                <SpeedInsights />
                <Analytics />
              </main>
              <Toaster richColors />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}