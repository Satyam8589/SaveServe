"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { FirebaseAuthProvider } from "@/components/FirebaseAuthProvider";
import { NotificationProvider } from "@/provider/NotificationProvider";
import { useState } from "react";

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30,   // 30 minutes
            retry: (failureCount, error) => {
              if (error?.status === 404) return false;
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <FirebaseAuthProvider>
          <NotificationProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
              }}
            />
          </NotificationProvider>
        </FirebaseAuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
