import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import HeaderWrapper from "@/components/HeaderWrapper";

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
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/* Header Section */}
            <HeaderWrapper />

            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            {/* Footer Section */}
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}