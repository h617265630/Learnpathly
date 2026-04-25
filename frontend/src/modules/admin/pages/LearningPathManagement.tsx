import { useState, useEffect, useCallback } from "react";
import {
  getAdminLearningPaths,
  deleteAdminLearningPath,
  type AdminLearningPath,
} from "@/services/admin";
import { Button } from "@/components/ui/Button";

export default function LearningPathManagement() {
  const [paths, setPaths] = useState<AdminLearningPath[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const loadPaths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminLearningPaths({ skip, limit });
      setPaths(data.paths);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to load paths", e);
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  const prevPage = () => {
    setSkip(Math.max(0, skip - limit));
  };

  const nextPage = () => {
    setSkip(skip + limit);
  };

  const deletePath = async (path: AdminLearningPath) => {
    if (!window.confirm(`Delete "${path.title}"?`)) return;
    try {
      await deleteAdminLearningPath(path.id);
      alert("Learning path deleted successfully");
      loadPaths();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Delete failed";
      alert(`Delete failed: ${msg}`);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Learning Path Management
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage platform learning paths
          </p>
        </div>
      </div>

      {/* Learning Paths table */}
      <div className="rounded-md border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50">
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Visibility
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Users
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Created
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
                  colSpan={7}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  Loading...
                </td>
              </tr>
            ) : paths.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  No learning paths found
                </td>
              </tr>
            ) : (
              paths.map((path) => (
                <tr
                  key={path.id}
                  className="border-b last:border-0 hover:bg-stone-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900 max-w-xs truncate">
                      {path.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {path.category_name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        path.is_public
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {path.is_public ? "Public" : "Private"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        path.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {path.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {path.user_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {formatDate(path.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deletePath(path)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-stone-500">Total: {total} paths</p>
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
