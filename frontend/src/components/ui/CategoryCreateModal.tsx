import { useState } from "react";
import { X } from "lucide-react";
import { createCategory, type Category } from "@/services/category";
import { Button } from "./Button";

interface CategoryCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
}

export function CategoryCreateModal({
  open,
  onClose,
  onSuccess,
}: CategoryCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Backend automatically adds user prefix to code (e.g., u1_machine_learning)
      const created = await createCategory({
        name: name.trim(),
        description: description.trim() || null,
      });
      onSuccess(created);
      setName("");
      setDescription("");
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName("");
    setDescription("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900">Create Category</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Categories are personal and only visible to you
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Machine Learning"
              maxLength={100}
              className="w-full h-10 px-3 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this category"
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-sm bg-violet-600 text-white hover:bg-violet-700 font-semibold text-sm px-5 py-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
