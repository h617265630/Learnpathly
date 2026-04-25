import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth";
import {
  getAdminUsers,
  toggleUserStatus,
  toggleSuperuserStatus,
  type AdminUser,
} from "@/services/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function UserManagement() {
  const { user: authUser } = useAuthStore();
  const currentUserId = (authUser as { id?: number })?.id;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );
  const [filterSuperuser, setFilterSuperuser] = useState<boolean | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers({
        skip,
        limit,
        search: search || undefined,
        is_active: filterActive,
        is_superuser: filterSuperuser,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  }, [skip, search, filterActive, filterSuperuser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkip(0);
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const prevPage = () => {
    setSkip(Math.max(0, skip - limit));
  };

  const nextPage = () => {
    setSkip(skip + limit);
  };

  const toggleStatus = async (user: AdminUser) => {
    try {
      await toggleUserStatus(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        )
      );
    } catch (e) {
      console.error("Failed to toggle status", e);
    }
  };

  const toggleAdmin = async (user: AdminUser) => {
    try {
      await toggleSuperuserStatus(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_superuser: !u.is_superuser } : u
        )
      );
    } catch (e) {
      console.error("Failed to toggle superuser", e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">User Management</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage platform users and permissions
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search users..."
            aria-label="Search users"
            className="h-10 w-64 px-3 pl-10 border border-stone-200 rounded-md bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <select
          value={filterActive === undefined ? "" : String(filterActive)}
          onChange={(e) =>
            setFilterActive(
              e.target.value === "" ? undefined : e.target.value === "true"
            )
          }
          className="h-10 px-3 border border-stone-200 rounded-md bg-white text-sm text-stone-900 outline-none focus:border-amber-400"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          value={filterSuperuser === undefined ? "" : String(filterSuperuser)}
          onChange={(e) =>
            setFilterSuperuser(
              e.target.value === "" ? undefined : e.target.value === "true"
            )
          }
          className="h-10 px-3 border border-stone-200 rounded-md bg-white text-sm text-stone-900 outline-none focus:border-amber-400"
        >
          <option value="">All Roles</option>
          <option value="true">Superuser</option>
          <option value="false">Regular User</option>
        </select>
      </div>

      {/* Users table */}
      <div className="rounded-md border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                User
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Roles
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Joined
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900">
                      {user.username}
                    </div>
                    {user.display_name && (
                      <div className="text-xs text-stone-500">
                        {user.display_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700"
                        >
                          {role}
                        </span>
                      ))}
                      {user.is_superuser && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-stone-900 text-white">
                          Superuser
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(user)}
                        disabled={user.id === currentUserId}
                      >
                        {user.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAdmin(user)}
                        disabled={user.id === currentUserId}
                      >
                        {user.is_superuser ? "Remove Admin" : "Make Admin"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-stone-500">Total: {total} users</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={skip === 0}
            onClick={prevPage}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={skip + limit >= total}
            onClick={nextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
