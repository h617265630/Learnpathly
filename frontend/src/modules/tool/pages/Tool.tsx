import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

type Tab =
  | "resource"
  | "myresource"
  | "category"
  | "learningpath"
  | "mylearningpath";

interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
}

interface DbResource {
  id: number;
  title: string;
  resource_type: string;
  platform?: string;
  category_name?: string;
  category_id?: number;
  summary?: string;
  source_url?: string;
}

interface PublicLearningPath {
  id: number;
  title: string;
  is_public: boolean;
  category_name?: string;
}

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=506&fit=crop";

function formatPlatform(platform?: string): string {
  if (!platform) return "—";
  return platform;
}

export default function Tool() {
  const [activeTab, setActiveTab] = useState<Tab>("resource");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resources, setResources] = useState<DbResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [learningPaths, setLearningPaths] = useState<PublicLearningPath[]>([]);
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbResource | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const title =
    activeTab === "resource"
      ? "Resources"
      : activeTab === "myresource"
      ? "My Resources"
      : activeTab === "category"
      ? "Categories"
      : activeTab === "learningpath"
      ? "LearningPaths"
      : "My LearningPaths";

  const subtitle =
    activeTab === "resource" || activeTab === "myresource"
      ? `共 ${resources.length} 条`
      : activeTab === "category"
      ? `共 ${categories.length} 条`
      : `共 ${learningPaths.length} 条`;

  const breadcrumbItems = [{ label: "Tools", to: "/tools" }, { label: title }];

  async function loadResources() {
    try {
      const res = await fetch("/api/resource/list", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("learnsmart_token") ||
            sessionStorage.getItem("learnsmart_token")
          }`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResources(Array.isArray(data) ? data : []);
    } catch {
      setResources([]);
    }
  }

  async function loadMyResources() {
    try {
      const res = await fetch("/api/resource/my", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("learnsmart_token") ||
            sessionStorage.getItem("learnsmart_token")
          }`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResources(Array.isArray(data) ? data : []);
    } catch {
      setResources([]);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch("/api/category/list", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("learnsmart_token") ||
            sessionStorage.getItem("learnsmart_token")
          }`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }

  async function loadLearningPaths() {
    try {
      const res = await fetch("/api/learningpath/list", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("learnsmart_token") ||
            sessionStorage.getItem("learnsmart_token")
          }`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLearningPaths(Array.isArray(data) ? data : []);
    } catch {
      setLearningPaths([]);
    }
  }

  async function loadMyLearningPaths() {
    try {
      const res = await fetch("/api/learningpath/my", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("learnsmart_token") ||
            sessionStorage.getItem("learnsmart_token")
          }`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLearningPaths(Array.isArray(data) ? data : []);
    } catch {
      setLearningPaths([]);
    }
  }

  const loadTab = useCallback(async (tab: Tab) => {
    setLoading(true);
    setError("");
    try {
      if (tab === "resource") {
        await loadResources();
      } else if (tab === "myresource") {
        await loadMyResources();
      } else if (tab === "category") {
        await loadCategories();
      } else if (tab === "learningpath") {
        await loadLearningPaths();
      } else {
        await loadMyLearningPaths();
      }
    } catch (e: any) {
      setError(String(e?.message || "加载失败"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTab(activeTab);
  }, [activeTab, loadTab]);

  function selectTab(tab: Tab) {
    if (activeTab === tab) return;
    setActiveTab(tab);
  }

  function reload() {
    void loadTab(activeTab);
  }

  function openDeleteConfirm(resource: DbResource) {
    if (deletingId !== null) return;
    setDeleteError("");
    setDeleteTarget(resource);
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    if (deletingId !== null) return;
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deletingId !== null) return;

    setDeleteError("");
    const resourceId = deleteTarget.id;
    setDeletingId(resourceId);
    setDeleting((prev) => ({ ...prev, [resourceId]: true }));

    try {
      const endpoint =
        activeTab === "myresource" ? "/api/resource/my" : "/api/resource";
      const res = await fetch(`${endpoint}/${resourceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("learnsmart_token") ||
            sessionStorage.getItem("learnsmart_token")
          }`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(String(e?.message || "删除失败"));
    } finally {
      setDeletingId(null);
      setDeleting((prev) => ({ ...prev, [resourceId]: false }));
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 -mt-4 md:-mt-6">
      <section className="border-b border-border pb-4">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <ol className="flex items-center gap-2">
            {breadcrumbItems.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                {item.to && idx !== breadcrumbItems.length - 1 ? (
                  <Link to={item.to} className="hover:text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-semibold">
                    {item.label}
                  </span>
                )}
                {idx !== breadcrumbItems.length - 1 && (
                  <span className="text-muted-foreground">/</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section>
        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-foreground">Tools</p>
              <p className="text-xs text-muted-foreground mt-1">
                查看数据库数据
              </p>

              <div className="mt-4 space-y-2">
                {(
                  [
                    "category",
                    "resource",
                    "learningpath",
                    "myresource",
                    "mylearningpath",
                  ] as Tab[]
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`w-full justify-start text-left px-3 py-2 text-sm rounded-none transition-colors ${
                      activeTab === tab
                        ? "bg-foreground text-background"
                        : "text-foreground hover:bg-stone-100"
                    }`}
                    onClick={() => selectTab(tab)}
                  >
                    {tab === "category"
                      ? "Category"
                      : tab === "resource"
                      ? "Resource"
                      : tab === "learningpath"
                      ? "LearningPath"
                      : tab === "myresource"
                      ? "MyResource"
                      : "MyPath"}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-4">
            <div className="border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reload}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm border border-stone-200 rounded-none hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  Reload
                </button>
              </div>
            </div>

            {loading && (
              <div className="border border-stone-200 bg-white p-4">
                <div className="text-sm text-muted-foreground">Loading…</div>
              </div>
            )}

            {error && (
              <div className="border border-stone-200 bg-white p-4">
                <div className="text-sm text-red-500">{error}</div>
              </div>
            )}

            {!loading &&
              !error &&
              (activeTab === "resource" || activeTab === "myresource") && (
                <div className="border border-stone-200 bg-white p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500">
                        <tr className="border-b border-slate-100">
                          <th className="py-2 pr-3">ID</th>
                          <th className="py-2 pr-3">Title</th>
                          <th className="py-2 pr-3">Type</th>
                          <th className="py-2 pr-3">Platform</th>
                          <th className="py-2 pr-3">Category</th>
                          <th className="py-2 pr-3">Summary</th>
                          <th className="py-2 pr-3">Source URL</th>
                          <th className="py-2 pr-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-900">
                        {resources.map((r) => (
                          <tr key={r.id} className="border-b border-slate-50">
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {r.id}
                            </td>
                            <td className="py-2 pr-3">{r.title}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {r.resource_type}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {formatPlatform(r.platform)}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {r.category_name || r.category_id || "—"}
                            </td>
                            <td className="py-2 pr-3">{r.summary || "—"}</td>
                            <td className="py-2 pr-3">
                              {r.source_url ? (
                                <a
                                  href={r.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {r.source_url}
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-2 pr-3 text-right">
                              <button
                                type="button"
                                className="text-red-500 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-none transition-colors disabled:opacity-50"
                                disabled={deleting[r.id]}
                                onClick={() => openDeleteConfirm(r)}
                                aria-label="Delete item"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {!loading && !error && activeTab === "category" && (
              <div className="border border-stone-200 bg-white p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr className="border-b border-slate-100">
                        <th className="py-2 pr-3">ID</th>
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Code</th>
                        <th className="py-2 pr-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-900">
                      {categories.map((c) => (
                        <tr key={c.id} className="border-b border-slate-50">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {c.id}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {c.name}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {c.code}
                          </td>
                          <td className="py-2 pr-3">{c.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading &&
              !error &&
              (activeTab === "learningpath" ||
                activeTab === "mylearningpath") && (
                <div className="border border-stone-200 bg-white p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500">
                        <tr className="border-b border-slate-100">
                          <th className="py-2 pr-3">ID</th>
                          <th className="py-2 pr-3">Title</th>
                          <th className="py-2 pr-3">Public</th>
                          <th className="py-2 pr-3">Category</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-900">
                        {learningPaths.map((lp) => (
                          <tr key={lp.id} className="border-b border-slate-50">
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {lp.id}
                            </td>
                            <td className="py-2 pr-3">{lp.title}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {lp.is_public ? "true" : "false"}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {lp.category_name || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </main>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Confirm delete
              </h2>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deletingId !== null}
                className="text-stone-500 hover:text-stone-700 p-1"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 p-6">
              <div className="text-sm text-foreground">
                Are you sure you want to delete this resource?
              </div>
              {activeTab !== "myresource" && (
                <div className="text-xs text-muted-foreground">
                  Tip: Deleting is intended for MyResource tab (detaches from
                  current user).
                </div>
              )}
              {deleteTarget && (
                <div className="border border-stone-200 bg-stone-50 p-3">
                  <div className="line-clamp-1 font-semibold text-foreground">
                    {deleteTarget.title}
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    ID: {deleteTarget.id}
                  </div>
                </div>
              )}
              {deleteError && (
                <p className="text-sm text-red-500">{deleteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-200 bg-stone-50 p-6">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deletingId !== null}
                className="px-4 py-2 text-sm border border-stone-200 rounded-none hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-none hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {deletingId !== null ? "Deleting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
