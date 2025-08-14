import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import { currentUser } from "@clerk/nextjs/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Smart food",
  description: "Connect with doctors anytime, anywhere",
};

export default async function RootLayout({ children }) {
  await currentUser();
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
            <Header />

            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}