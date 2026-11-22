
import { useAuth } from "../context/AuthContext";

function ProfilePage() {
  const { user } = useAuth();

  // Handle the unlikely case where profile data is unavailable.
  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-slate-600">
          Profile information is unavailable.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-slate-600">
          View your BookHub account information.
        </p>
      </div>

      {/* Profile information */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {user.name}
            </h2>

            <p className="text-sm text-slate-500">
              {user.role}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Full name
            </h3>

            <p className="mt-1 text-slate-900">{user.name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Email address
            </h3>

            <p className="mt-1 text-slate-900">{user.email}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Account role
            </h3>

            <p className="mt-1 text-slate-900">{user.role}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
