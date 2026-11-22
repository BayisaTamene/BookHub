
import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isLoading, authError } = useAuth();
  const location = useLocation();

  // Wait until the existing session check has finished.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Checking authentication...</p>
      </div>
    );
  }

  // Do not redirect when the authentication status is unknown.
  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p role="alert" className="text-red-600">
            {authError}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Please refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Allow authenticated users to access the nested protected route.
  return <Outlet />;
}

export default ProtectedRoute;
