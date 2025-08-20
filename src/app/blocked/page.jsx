"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Shield, AlertTriangle, Mail, Phone, ExternalLink, LogOut } from "lucide-react";

export default function BlockedPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [blockInfo, setBlockInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockInfo = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/user-status/${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setBlockInfo(data.userStatus);
        }
      } catch (error) {
        console.error("Error fetching block info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockInfo();
  }, [user]);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-red-500/30 shadow-2xl">
          {/* Warning Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-4 h-4 text-yellow-900" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Account Suspended
          </h1>
          
          {/* Subtitle */}
          <p className="text-red-100 mb-6 leading-relaxed">
            We found some concerning activity from your account that violates our community guidelines.
          </p>

          {/* Block Details */}
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Suspension Details
            </h3>
            
            {blockInfo?.statusReason ? (
              <p className="text-red-100 text-sm mb-2">
                <strong>Reason:</strong> {blockInfo.statusReason}
              </p>
            ) : (
              <p className="text-red-100 text-sm mb-2">
                <strong>Reason:</strong> Policy violation detected
              </p>
            )}
            
            {blockInfo?.statusChangedAt && (
              <p className="text-red-100 text-sm">
                <strong>Date:</strong> {new Date(blockInfo.statusChangedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* What to do next */}
          <div className="bg-white/10 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-white mb-2">What can you do?</h3>
            <ul className="text-gray-200 text-sm space-y-1">
              <li>• Review our community guidelines</li>
              <li>• Contact support if you believe this is an error</li>
              <li>• Wait for admin review of your account</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="space-y-3 mb-6">
            <a
              href="mailto:support@smartfoodredistribution.com"
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-400 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
            
            <a
              href="/community-guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 border border-gray-500/30 hover:border-gray-400 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Community Guidelines
            </a>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

          {/* Footer */}
          <p className="text-red-200 text-xs mt-4 opacity-75">
            Account suspensions are reviewed regularly by our admin team.
          </p>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-orange-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-yellow-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>
    </div>
  );
}
