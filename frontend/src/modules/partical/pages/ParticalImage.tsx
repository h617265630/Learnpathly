import { useState, useEffect, useCallback } from "react";
import { listMyUserImages, type UserImage } from "@/services/userImage";
import { Button } from "@/components/ui/Button";

function formatTime(v: string) {
  try {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
  } catch {
    return v;
  }
}

export default function ParticalImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<UserImage[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMyUserImages();
      setImages(data || []);
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      setError(
        String(err.response?.data?.detail || err.message || "Failed to load")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-6">
          <p className="text-sm font-semibold text-stone-900">加载失败</p>
          <p className="mt-1 text-sm text-stone-500">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-md"
            onClick={load}
          >
            Retry
          </Button>
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-6">
          <p className="text-sm font-semibold text-stone-900">暂无图片</p>
          <p className="mt-1 text-sm text-stone-500">
            你在 Creator 里上传的图片会显示在这里。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-md border border-stone-200 bg-white"
              >
                <div className="aspect-video bg-stone-100">
                  <img
                    src={img.image_url}
                    alt={img.title || "image"}
                    className="h-full w-full object-contain bg-stone-50"
                    style={{ objectFit: "contain" }}
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <p
                    className="text-sm font-semibold text-stone-900 truncate"
                    title={img.title || "无标题"}
                  >
                    {img.title || "无标题"}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatTime(img.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
