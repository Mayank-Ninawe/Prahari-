/**
 * Prahari AI - Firebase Configuration & Initialization Scaffolding
 * Safe workspace initialization that prevents app crashes when Firebase is not yet provisioned.
 */

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Dynamic LocalStorage & Environment Overrides to securely bind custom runtime values without exposure
const getActiveConfig = () => {
  const activeConfig = { ...firebaseConfig };

  // Prioritize Vite environment variables if defined (secure runtime configuration)
  if (import.meta.env.VITE_FIREBASE_API_KEY) activeConfig.apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) activeConfig.authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if (import.meta.env.VITE_FIREBASE_PROJECT_ID) activeConfig.projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) activeConfig.storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) activeConfig.messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  if (import.meta.env.VITE_FIREBASE_APP_ID) activeConfig.appId = import.meta.env.VITE_FIREBASE_APP_ID;
  if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) activeConfig.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  if (typeof window !== "undefined") {
    const customApiKey = localStorage.getItem("prahari_firebase_api_key");
    const customAuthDomain = localStorage.getItem("prahari_firebase_auth_domain");
    const customProjectId = localStorage.getItem("prahari_firebase_project_id");
    const customStorageBucket = localStorage.getItem("prahari_firebase_storage_bucket");
    const customMessagingSenderId = localStorage.getItem("prahari_firebase_messaging_sender_id");
    const customAppId = localStorage.getItem("prahari_firebase_app_id");
    const customFirestoreDatabaseId = localStorage.getItem("prahari_firebase_firestore_database_id");

    if (customApiKey) activeConfig.apiKey = customApiKey;
    if (customAuthDomain) activeConfig.authDomain = customAuthDomain;
    if (customProjectId) activeConfig.projectId = customProjectId;
    if (customStorageBucket) activeConfig.storageBucket = customStorageBucket;
    if (customMessagingSenderId) activeConfig.messagingSenderId = customMessagingSenderId;
    if (customAppId) activeConfig.appId = customAppId;
    if (customFirestoreDatabaseId) {
      activeConfig.firestoreDatabaseId = customFirestoreDatabaseId;
    }
  }
  return activeConfig;
};

const activeFirebaseConfig = getActiveConfig();
const isConfigured = !!activeFirebaseConfig && !!activeFirebaseConfig.apiKey;

// Initialize standard services
let app: any = null;
export let db: any = null;
export let auth: any = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(activeFirebaseConfig) : getApp();
    db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    console.log("Firebase initialized successfully on Prahari AI.");
    
    // Skill requirement: Validate Connection to Firestore on startup
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.warn("Please check your Firebase configuration: Client is offline.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.warn("Firebase initialization failed. Using mock stub mode.", err);
  }
} else {
  console.log("Firebase not yet provisioned (Phase 1 Workspace Mode). Firestore and Auth are in mock/stub state.");
}

// =========================================================================
// ERROR HANDLER (Strict Firebase Skill Mandated Pattern)
// =========================================================================

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Handles Firestore security exceptions by packaging diagnostic auth metrics into a standard JSON message.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error Exception Caught:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
