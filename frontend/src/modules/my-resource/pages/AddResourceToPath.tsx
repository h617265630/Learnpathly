import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  listMyLearningPaths,
  addResourceToMyLearningPath,
} from "@/services/learningPath";

type PathSummary = {
  id: number;
  title: string;
  description?: string | null;
};

export default function AddResourceToPath() {
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: string; id: string }>();

  const [paths, setPaths] = useState<PathSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await listMyLearningPaths();
        setPaths(data ?? []);
      } catch {
        setPaths([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleAdd(pathId: number) {
    if (!id) return;
    setError("");
    setAddingId(pathId);
    try {
      await addResourceToMyLearningPath(pathId, {
        resource_id: Number(id),
      });
      navigate("/my-paths");
    } catch (e: any) {
      setError(
        String(e?.response?.data?.detail || e?.message || "Failed to add")
      );
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Add to Path
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.9]">
                Choose a
                <br />
                <span className="text-amber-500">Learning Path.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {loading && (
          <div className="text-center py-12 text-stone-400">
            Loading paths...
          </div>
        )}

        {!loading && paths.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-500 mb-4">
              You have no learning paths yet.
            </p>
            <Button
              className="rounded-none bg-amber-500 text-white hover:bg-amber-600"
              onClick={() => navigate("/createpath")}
            >
              Create a Path
            </Button>
          </div>
        )}

        {!loading && paths.length > 0 && (
          <div className="space-y-3">
            {paths.map((path) => (
              <div
                key={path.id}
                className="rounded-md bg-white border border-stone-100 p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-stone-900">{path.title}</h3>
                  {path.description && (
                    <p className="text-sm text-stone-400 mt-1 line-clamp-1">
                      {path.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="rounded-none bg-amber-500 text-white hover:bg-amber-600"
                  disabled={addingId === path.id}
                  onClick={() => handleAdd(path.id)}
                >
                  {addingId === path.id ? "Adding..." : "Add"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center mt-4">{error}</p>
        )}
      </main>
    </div>
  );
}
