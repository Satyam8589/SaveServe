// app/api/auth/firebase-token/route.js (Fixed to work with your JSON format)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Parse Firebase service account from environment variables
function getFirebaseConfig() {
  console.log('🔍 Firebase Config Check...');
  
  // Check if we have the full JSON in FIREBASE_SERVICE_ACCOUNT_KEY
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    console.log('✅ Found FIREBASE_SERVICE_ACCOUNT_KEY');
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      console.log('✅ Successfully parsed service account JSON');
      console.log('- Project ID:', serviceAccount.project_id ? '✅' : '❌');
      console.log('- Client Email:', serviceAccount.client_email ? '✅' : '❌');
      console.log('- Private Key:', serviceAccount.private_key ? '✅' : '❌');
      
      return serviceAccount;
    } catch (parseError) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', parseError.message);
      throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }
  
  // Fallback to individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  console.log('🔄 Checking individual environment variables:');
  console.log('- FIREBASE_PROJECT_ID:', projectId ? '✅' : '❌');
  console.log('- FIREBASE_CLIENT_EMAIL:', clientEmail ? '✅' : '❌');
  console.log('- FIREBASE_PRIVATE_KEY:', privateKey ? '✅' : '❌');
  
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(`Missing Firebase configuration. Either provide:
      1. FIREBASE_SERVICE_ACCOUNT_KEY (full JSON) - RECOMMENDED
      OR
      2. All individual variables:
         - FIREBASE_PROJECT_ID: ${projectId ? 'OK' : 'MISSING'}
         - FIREBASE_CLIENT_EMAIL: ${clientEmail ? 'OK' : 'MISSING'}
         - FIREBASE_PRIVATE_KEY: ${privateKey ? 'OK' : 'MISSING'}`);
  }
  
  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n')
  };
}

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return existingApps[0];
    }

    // Get Firebase configuration
    const serviceAccount = getFirebaseConfig();

    // Initialize Firebase Admin
    console.log('🚀 Initializing Firebase Admin...');
    const app = initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');
    return app;

  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    console.log('🔍 Starting firebase-token API...');

    // Verify Clerk authentication
    const { userId } = await auth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clerkUserId } = body;

    // Initialize Firebase Admin and log config
    const serviceAccount = getFirebaseConfig();
    console.log('🔍 Server Config - Project ID:', serviceAccount.project_id);
    
    // CRITICAL: Log what project the custom token will be created for
    console.log('🎟️ Creating custom token for project:', serviceAccount.project_id);
    console.log('🎟️ Creating custom token for user:', clerkUserId);

    const app = initializeFirebaseAdmin();
    const adminAuth = getAdminAuth(app);
    
    const additionalClaims = {
      clerk_user_id: clerkUserId,
      created_at: Date.now(),
    };

    const customToken = await adminAuth.createCustomToken(clerkUserId, additionalClaims);
    console.log('✅ Custom token created successfully');
    console.log('🔍 Token length:', customToken.length);

    return NextResponse.json({
      customToken,
      success: true,
      userId: clerkUserId,
      projectId: serviceAccount.project_id, // Return this for debugging
      message: 'Firebase custom token created successfully'
    });

  } catch (error) {
    console.error('❌ Firebase token API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Firebase token',
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}