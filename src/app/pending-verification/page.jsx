"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, Clock, Sparkles, ArrowRight } from "lucide-react";

export default function PendingVerificationPage() {
  const router = useRouter();
  const { user } = useUser();
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRedirecting(true);
          
          // Redirect to appropriate dashboard after countdown
          setTimeout(() => {
            // Determine dashboard based on user metadata or default to recipient
            const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
            if (userRole === "PROVIDER") {
              router.push("/providerDashboard");
            } else {
              router.push("/recipientDashboard");
            }
          }, 500);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 shadow-2xl">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Profile Completed! 🎉
          </h1>
          
          {/* Subtitle */}
          <p className="text-blue-100 mb-6 leading-relaxed">
            Welcome to Smart Food Redistribution! Your profile has been successfully created and you can start using the platform immediately.
          </p>

          {/* Verification Status */}
          <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-300">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Account Verified</span>
            </div>
            <p className="text-green-200 text-sm mt-1">
              You can now access all features of the platform
            </p>
          </div>

          {/* Countdown */}
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-white mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Redirecting to Dashboard</span>
            </div>
            
            {!isRedirecting ? (
              <div className="text-3xl font-bold text-blue-300 animate-pulse">
                {countdown}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-blue-300">
                <ArrowRight className="w-5 h-5 animate-pulse" />
                <span className="font-medium">Redirecting...</span>
              </div>
            )}
          </div>

          {/* Skip Button */}
          <button
            onClick={() => {
              setIsRedirecting(true);
              const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
              if (userRole === "PROVIDER") {
                router.push("/providerDashboard");
              } else {
                router.push("/recipientDashboard");
              }
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Redirecting...
              </span>
            ) : (
              "Continue to Dashboard"
            )}
          </button>

          {/* Footer */}
          <p className="text-blue-200 text-xs mt-4 opacity-75">
            Thank you for joining our mission to reduce food waste! 🌱
          </p>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-green-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>
    </div>
  );
}
