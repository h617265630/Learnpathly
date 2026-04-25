import { useState, useEffect, useCallback } from "react";
import {
  getAdminResources,
  deleteAdminResource,
  type AdminResource,
} from "@/services/admin";
import { Button } from "@/components/ui/Button";

export default function ResourceManagement() {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminResources({ skip, limit });
      setResources(data.resources);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to load resources", e);
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const prevPage = () => {
    setSkip(Math.max(0, skip - limit));
  };

  const nextPage = () => {
    setSkip(skip + limit);
  };

  const deleteResource = async (resource: AdminResource) => {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;
    try {
      await deleteAdminResource(resource.id);
      alert("Resource deleted successfully");
      loadResources();
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
            Resource Management
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage platform resources
          </p>
        </div>
      </div>

      {/* Resources table */}
      <div className="rounded-md border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50">
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Platform
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Saves
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Trending
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
                  colSpan={8}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  Loading...
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-stone-500"
                >
                  No resources found
                </td>
              </tr>
            ) : (
              resources.map((resource) => (
                <tr
                  key={resource.id}
                  className="border-b last:border-0 hover:bg-stone-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900 max-w-xs truncate">
                      {resource.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">
                      {resource.resource_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {resource.platform || "-"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {resource.category_name || "-"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {resource.save_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {resource.trending_score.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {formatDate(resource.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteResource(resource)}
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
        <p className="text-sm text-stone-500">Total: {total} resources</p>
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
