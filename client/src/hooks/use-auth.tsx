import React, { createContext, useContext, useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, googleAuthProvider, isMockMode } from "../lib/firebase";
import { useToast } from "./use-toast";

export interface UserProfile {
  id: number; // Database synced integer ID
  username: string; // Synced from Google Name/Email
  firebaseUid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Helper to sync user to our backend database
  const syncUserToBackend = async (userData: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }) => {
    try {
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: userData.uid,
          username: userData.email || userData.displayName || `user_${userData.uid.slice(0, 5)}`,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to synchronize user session with server");
      }

      const dbUser = await response.json();
      
      const fullProfile: UserProfile = {
        id: dbUser.id,
        username: dbUser.username,
        firebaseUid: userData.uid,
        email: userData.email || undefined,
        displayName: userData.displayName || undefined,
        photoURL: userData.photoURL || undefined,
      };

      setUser(fullProfile);
      // Persist to sessionStorage for quick loads
      sessionStorage.setItem("hangoutHeroUser", JSON.stringify(fullProfile));
    } catch (error) {
      console.error("User sync error:", error);
      toast({
        title: "Synchronization Error",
        description: "Your session could not be synced with the server. Saved trips might not load.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isMockMode) {
      // Mock Sandbox Loader
      const savedUser = sessionStorage.getItem("hangoutHeroUser");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    // Standard Live Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        await syncUserToBackend({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });
      } else {
        setUser(null);
        sessionStorage.removeItem("hangoutHeroUser");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        // Mock Sandbox Authentication
        toast({
          title: "Mock Sandbox Login",
          description: "No Firebase configuration found. Launching Mock Google Login experience...",
        });

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockGoogleData = {
          uid: "mock-google-uid-777",
          email: "aditya.travels@gmail.com",
          displayName: "Aditya Singh (Beta)",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&w=150",
        };

        await syncUserToBackend(mockGoogleData);

        toast({
          title: "Welcome, " + mockGoogleData.displayName + "!",
          description: "Successfully logged in via Mock Google sandbox.",
        });
      } else {
        // Standard Live Google Login
        if (!auth) throw new Error("Firebase Auth is not initialized.");
        const result = await signInWithPopup(auth, googleAuthProvider);
        const fbUser = result.user;

        await syncUserToBackend({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });

        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${fbUser.displayName || fbUser.email}`,
        });
      }
    } catch (error: any) {
      console.error("Login failure:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to log in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!isMockMode && auth) {
        await signOut(auth);
      }
      setUser(null);
      sessionStorage.removeItem("hangoutHeroUser");
      toast({
        title: "Signed Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error("Sign-out failure:", error);
      toast({
        title: "Sign Out Failed",
        description: "Failed to log you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
