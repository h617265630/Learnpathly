import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Shield, User } from "lucide-react";
import { getAdminStats, type AdminStats, getAdminCategories, createAdminCategory, deleteAdminCategory, type AdminCategory } from "@/services/admin";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        setError("Failed to load stats");
        console.error("Failed to load admin stats", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getAdminCategories();
        setCategories(cats || []);
      } catch {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryError("");
    setCreatingCategory(true);
    try {
      const created = await createAdminCategory({
        name: newCategoryName.trim(),
        code: newCategoryCode.trim() || undefined,
        description: newCategoryDesc.trim() || null,
      });
      setCategories((prev) => [created, ...prev]);
      setNewCategoryName("");
      setNewCategoryCode("");
      setNewCategoryDesc("");
      setShowCategoryForm(false);
    } catch (err: any) {
      setCategoryError(err?.response?.data?.detail || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteAdminCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to delete category");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">
          Dashboard Overview
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Platform statistics and metrics
        </p>
      </div>

      {/* Stats cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardDescription className="text-stone-500">
                  Loading...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-stone-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-md border border-stone-200 bg-white p-6 mb-8">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">
                Total Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_users.toLocaleString()}
              </p>
              {stats.users_last_7_days > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  +{stats.users_last_7_days} this week
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">
                Active Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.active_users.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">
                Learning Paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_learning_paths.toLocaleString()}
              </p>
              {stats.paths_last_7_days > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  +{stats.paths_last_7_days} this week
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-stone-500">
                Resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {stats.total_resources.toLocaleString()}
              </p>
              {stats.resources_last_7_days > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  +{stats.resources_last_7_days} this week
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/admin/users">
          <Button>Manage Users</Button>
        </Link>
        <Link to="/admin/resources">
          <Button variant="outline">Manage Resources</Button>
        </Link>
        <Link to="/admin/paths">
          <Button variant="outline">Manage Paths</Button>
        </Link>
        <Link to="/admin/analytics">
          <Button variant="outline">View Analytics</Button>
        </Link>
      </div>

      {/* Category Management */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Category Management</h2>
          <p className="text-sm text-stone-500">System categories available to all users</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategoryForm(!showCategoryForm)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add System Category
        </Button>
      </div>

      {/* Create Category Form */}
      {showCategoryForm && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. DevOps"
                    className="w-full h-9 px-3 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Code (auto if empty)
                  </label>
                  <input
                    type="text"
                    value={newCategoryCode}
                    onChange={(e) => setNewCategoryCode(e.target.value)}
                    placeholder="e.g. devops"
                    className="w-full h-9 px-3 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Optional description"
                    className="w-full h-9 px-3 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              {categoryError && (
                <p className="text-xs text-red-500">{categoryError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={creatingCategory || !newCategoryName.trim()}
                >
                  {creatingCategory ? "Creating…" : "Create Category"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryError("");
                    setNewCategoryName("");
                    setNewCategoryCode("");
                    setNewCategoryDesc("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category List */}
      {categoriesLoading ? (
        <div className="text-sm text-stone-400">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="text-sm text-stone-400">No categories yet.</div>
      ) : (
        <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-stone-600">Code</th>
                <th className="text-left px-4 py-2 font-medium text-stone-600">Description</th>
                <th className="text-left px-4 py-2 font-medium text-stone-600">Type</th>
                <th className="text-left px-4 py-2 font-medium text-stone-600">Owner</th>
                <th className="text-right px-4 py-2 font-medium text-stone-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-2 font-medium text-stone-900">{cat.name}</td>
                  <td className="px-4 py-2 text-stone-500 font-mono text-xs">{cat.code}</td>
                  <td className="px-4 py-2 text-stone-500 text-xs">{cat.description || "—"}</td>
                  <td className="px-4 py-2">
                    {cat.is_system ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        System
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                        <User className="w-3 h-3" />
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-stone-500 text-xs">
                    {cat.is_system ? "—" : cat.owner_user_id || "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {cat.is_system && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
