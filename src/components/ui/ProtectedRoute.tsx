import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { FirebaseService, UserDocument } from "../../services/firebaseService";
import { LockedRoute } from "../../config/constants";

// Authentication Context Definition
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
  userDoc: UserDocument | null;
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refresh user document helper
  const refreshUserDoc = async () => {
    if (firebaseUser) {
      try {
        const docData = await FirebaseService.getUserDocument(firebaseUser.uid);
        if (docData) {
          setUserDoc(docData);
        }
      } catch (err) {
        console.error("Error refreshing user document:", err);
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsAuthenticated(true);
        try {
          let docData = await FirebaseService.getUserDocument(user.uid);
          if (!docData) {
            // Safe initial creation of document if user exists but has no doc
            docData = await FirebaseService.createUserDocument(user.uid, user.email || "", user.displayName || "");
          }
          setUserDoc(docData);
        } catch (e) {
          console.error("Failed to load user document:", e);
        }
      } else {
        setFirebaseUser(null);
        setUserDoc(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase configuration not found.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase configuration not found.");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signup = async (email: string, password: string, fullName: string) => {
    if (!auth) throw new Error("Firebase configuration not found.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Explicitly seed the user document instantly on register
    await FirebaseService.createUserDocument(cred.user.uid, email, fullName);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const user = firebaseUser ? {
    email: firebaseUser.email || "",
    name: userDoc?.fullName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Workspace User"
  } : null;

  if (isLoading) {
    return (
      <div id="auth-loading-screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Synchronizing Prahari workspace...
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      firebaseUser, 
      userDoc, 
      user,
      login, 
      loginWithGoogle,
      signup, 
      logout,
      refreshUserDoc
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}

/**
 * ProtectedRoute component that blocks unauthenticated access
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={LockedRoute.AUTH} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
