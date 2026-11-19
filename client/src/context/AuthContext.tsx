
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authApi } from "../lib/auth";
import type { User } from "../types/auth";

// Defines the information and functions shared across the application.
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Creates the authentication context.
// undefined means no AuthProvider has supplied a value yet.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provides authentication state and functions to all child components.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Stores the currently authenticated user, or null if nobody is logged in.
  const [user, setUser] = useState<User | null>(null);

  // Starts as true because we must check the existing session first.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tracks whether this provider is still mounted.
    let isMounted = true;

    // Check whether the browser already has a valid login session.
    authApi
      .getCurrentUser()
      .then((response) => {
        // Update the user only if the provider is still mounted.
        if (isMounted) {
          setUser(response.data);
        }
      })
      .catch(() => {
        // No valid session or a failed request: treat the user as logged out.
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        // Finish the initial loading state after the request settles.
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // Cleanup: prevent state updates after the provider unmounts.
    return () => {
      isMounted = false;
    };
  }, []);

  // Sends login credentials to the backend and stores the returned user.
  async function login(email: string, password: string): Promise<void> {
    const response = await authApi.login({ email, password });
    setUser(response.data);
  }

  // Ends the server session before clearing the frontend user state.
  async function logout(): Promise<void> {
    await authApi.logout();
    setUser(null);
  }

  // Makes authentication information available to all child components.
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for accessing authentication information in components.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  // Prevent using the hook outside the AuthProvider.
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
