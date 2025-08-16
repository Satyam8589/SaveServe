'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

const DashboardPage = () => {
  const { sessionClaims } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (sessionClaims) {
      const mainRole = sessionClaims.publicMetadata?.mainRole;
      if (mainRole === 'PROVIDER') {
        router.push('/providerDashboard');
      } else if (mainRole === 'RECIPIENT') {
        router.push('/recipientDashboard');
      } else {
        // Fallback to a default dashboard if the role is not set
        router.push('/');
      }
    }
  }, [sessionClaims, router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl text-gray-300">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardPage;
