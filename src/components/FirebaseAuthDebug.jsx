// components/FirebaseAuthDebug.jsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useFirebaseAuth } from '@/components/FirebaseAuthProvider';
import { useState } from 'react';

export default function FirebaseAuthDebug() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { 
    firebaseUser, 
    isFirebaseAuthenticated, 
    isLoading, 
    error, 
    retryCount,
    signInToFirebase 
  } = useFirebaseAuth();
  
  const [manualRetryLoading, setManualRetryLoading] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);

  // Test the Firebase token API endpoint directly
  const testFirebaseTokenAPI = async () => {
    if (!clerkUser) {
      setApiTestResult({ success: false, error: 'No Clerk user' });
      return;
    }

    setApiTestResult({ testing: true });

    try {
      console.log('🔧 Testing Firebase token API endpoint...');
      const response = await fetch('/api/auth/firebase-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: clerkUser.id,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setApiTestResult({ 
          success: true, 
          message: 'Successfully got Firebase custom token from API',
          projectId: data.projectId,
          tokenLength: data.customToken?.length || 0
        });
      } else {
        setApiTestResult({ 
          success: false, 
          error: `API Error: ${data.error || 'Unknown error'}`,
          status: response.status
        });
      }
    } catch (error) {
      console.error('🔧 API test failed:', error);
      setApiTestResult({ 
        success: false, 
        error: `Network Error: ${error.message}` 
      });
    }
  };

  const handleManualRetry = async () => {
    setManualRetryLoading(true);
    try {
      await signInToFirebase();
    } catch (err) {
      console.error('Manual retry failed:', err);
    }
    setManualRetryLoading(false);
  };

  const authState = {
    clerkLoaded: isClerkLoaded,
    clerkUser: !!clerkUser,
    clerkUserId: clerkUser?.id,
    firebaseUser: !!firebaseUser,
    firebaseUserId: firebaseUser?.uid,
    isFirebaseAuthenticated,
    isAuthLoading: isLoading,
    retryCount,
    error: error?.message,
    userIdsMatch: firebaseUser?.uid === clerkUser?.id
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🔧 Firebase Authentication Debug</h2>
      
      {/* Current State */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current State:</h3>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-3 rounded ${isClerkLoaded && clerkUser ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="font-semibold">Clerk Auth</div>
          <div>{isClerkLoaded && clerkUser ? '✅ Ready' : '❌ Not Ready'}</div>
          <div className="text-xs mt-1">{clerkUser?.id || 'No user ID'}</div>
        </div>
        
        <div className={`p-3 rounded ${isFirebaseAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="font-semibold">Firebase Auth</div>
          <div>{isFirebaseAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
          <div className="text-xs mt-1">{firebaseUser?.uid || 'No Firebase user'}</div>
        </div>
        
        <div className={`p-3 rounded ${authState.userIdsMatch ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          <div className="font-semibold">ID Match</div>
          <div>{authState.userIdsMatch ? '✅ Match' : '⚠️ No Match'}</div>
          <div className="text-xs mt-1">Retry: {retryCount}/3</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-red-800 mb-2">❌ Authentication Error:</h4>
          <p className="text-red-700 whitespace-pre-wrap text-sm">{error.message || error}</p>
          {retryCount >= 3 && (
            <p className="text-red-600 mt-2 font-semibold">
              Max retries reached ({retryCount}/3) - Authentication stopped
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={testFirebaseTokenAPI}
          disabled={!clerkUser || apiTestResult?.testing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {apiTestResult?.testing ? '⏳ Testing...' : '🔧 Test API Endpoint'}
        </button>
        
        <button
          onClick={handleManualRetry}
          disabled={!clerkUser || manualRetryLoading || retryCount >= 3}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          {manualRetryLoading ? '⏳ Retrying...' : '🔄 Manual Retry'}
        </button>
      </div>

      {/* API Test Result */}
      {apiTestResult && !apiTestResult.testing && (
        <div className={`p-4 rounded border mb-6 ${
          apiTestResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <h4 className="font-semibold mb-2">
            {apiTestResult.success ? '✅ API Test Success' : '❌ API Test Failed'}
          </h4>
          <p className="text-sm">{apiTestResult.success ? apiTestResult.message : apiTestResult.error}</p>
          {apiTestResult.projectId && (
            <p className="text-xs mt-1">Server Project ID: {apiTestResult.projectId}</p>
          )}
          {apiTestResult.tokenLength && (
            <p className="text-xs">Token length: {apiTestResult.tokenLength} characters</p>
          )}
          {apiTestResult.status && (
            <p className="text-xs">HTTP Status: {apiTestResult.status}</p>
          )}
        </div>
      )}

      {/* Troubleshooting */}
      {(error || retryCount >= 2) && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🔧 Troubleshooting Checklist:</h4>
          <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm">
            <li>Clerk Firebase integration is enabled in Clerk Dashboard</li>
            <li>Service account key is properly uploaded in Clerk</li>
            <li>API endpoint `/api/auth/firebase-token` is working (test it above)</li>
            <li>Environment variables match your Firebase project</li>
            <li>Project ID matches between client config and server service account</li>
            <li>Firebase Authentication is enabled in Firebase Console</li>
          </ol>
          
          <div className="mt-3 p-3 bg-blue-100 rounded text-xs">
            <p className="font-medium">Expected Project ID: saveserve-f9fb5</p>
            <p>Client Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
          </div>
        </div>
      )}
    </div>
  );
}