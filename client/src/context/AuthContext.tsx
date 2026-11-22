
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authApi } from "../lib/auth";
import { ApiError } from "../lib/api";
import type { User } from "../types/auth";

// Defines the information and functions shared across the application.
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
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

  // Stores failures that prevent us from verifying the current session.
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Tracks whether this provider is still mounted.
    let isMounted = true;

    // Check whether the browser already has a valid login session.
    authApi
      .getCurrentUser()
      .then((response) => {
        if (isMounted) {
          setUser(response.data);
          setAuthError(null);
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) return;

        // A 401 means the server confirmed there is no valid session.
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          setAuthError(null);
          return;
        }

        // Other failures mean session verification was unsuccessful.
        setAuthError(
          "Unable to verify your session. Please check your connection and try again.",
        );
      })
      .finally(() => {
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
    setAuthError(null);
  }

  // Ends the server session before clearing the frontend user state.
  async function logout(): Promise<void> {
    await authApi.logout();

    setUser(null);
    setAuthError(null);
  }

  // Makes authentication information available to all child components.
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        authError,
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
