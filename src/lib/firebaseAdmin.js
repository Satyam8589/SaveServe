// lib/firebaseAdmin.js
import admin from 'firebase-admin';

let firebaseAdmin = null;

if (!admin.apps.length) {
  try {
    // Parse the service account JSON from environment variable
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
} else {
  firebaseAdmin = admin.apps[0];
}

export { admin as firebaseAdmin };
export default firebaseAdmin;