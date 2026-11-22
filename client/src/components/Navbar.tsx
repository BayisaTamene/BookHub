
import { useState } from "react";
import { NavLink } from "react-router";

import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isLoading, authError, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // End the server session and update the shared authentication state.
  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Logout failed. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* BookHub logo */}
        <NavLink to="/" className="text-2xl font-bold text-blue-600">
          BookHub
        </NavLink>

        {/* Main navigation links */}
        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-blue-600"
                : "text-slate-600 hover:text-blue-600"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-blue-600"
                : "text-slate-600 hover:text-blue-600"
            }
          >
            Explore
          </NavLink>
        </div>

        {/* Authentication navigation */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-sm text-slate-500">
              Checking session...
            </span>
          ) : authError ? (
            <span role="alert" className="text-sm text-red-600">
              Session unavailable
            </span>
          ) : user ? (
            <>
              <NavLink
                to="/profile"
                className="text-sm font-medium text-slate-700 transition hover:text-blue-600"
              >
                Hello, {user.name}
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Signing Out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="font-medium text-slate-600 hover:text-blue-600"
              >
                Sign In
              </NavLink>

              <NavLink
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create Account
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {logoutError && (
        <p role="alert" className="pb-3 text-center text-sm text-red-600">
          {logoutError}
        </p>
      )}
    </header>
  );
}

export default Navbar;
