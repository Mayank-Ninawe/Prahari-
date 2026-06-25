/**
 * Prahari AI - Firebase Configuration & Initialization Scaffolding
 * Safe workspace initialization that prevents app crashes when Firebase is not yet provisioned.
 */

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Safe loading of firebase config to prevent compile-time crashes
let firebaseConfig: any = null;

try {
  // Try to load the config from the generated file if present (Phase 2/3)
  // We use this dynamic-style or a try-catch for safe runtime detection
  firebaseConfig = require("./firebase-applet-config.json");
} catch (e) {
  // Fallback placeholder during Phase 1 Workspace Setup
  firebaseConfig = null;
}

const isConfigured = !!firebaseConfig && !!firebaseConfig.apiKey;

// Initialize standard services
let app: any = null;
export let db: any = null;
export let auth: any = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    console.log("Firebase initialized successfully on Prahari AI.");
    
    // Skill requirement: Validate Connection to Firestore on startup
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration: Client is offline.");
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
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
