import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth";
import { updateCurrentUser, uploadMyAvatar } from "@/services/user";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function AccountUserInfo() {
  const { user, isAuthed, fetchProfile, bumpAvatarBuster, avatarBuster } =
    useAuthStore();

  useEffect(() => {
    if (isAuthed) {
      fetchProfile(true).catch(() => {});
    }
  }, [isAuthed, fetchProfile]);

  const displayName = (user as any)?.display_name || user?.username || "User";
  const username = user?.username || "";
  const email = user?.email || "";
  const avatarUrl = (user as any)?.avatar_url;
  const avatarSrc = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarBuster}`
    : null;
  const initials = getInitials(displayName);

  const [form, setForm] = useState({ display_name: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  const pickedFileName = pickedFile?.name || "";

  // Sync form from user on mount and when user changes
  useEffect(() => {
    setForm({
      display_name: (user as any)?.display_name || "",
      bio: (user as any)?.bio || "",
    });
  }, [user]);

  const resetForm = useCallback(() => {
    setError("");
    setPickedFile(null);
    setForm({
      display_name: (user as any)?.display_name || "",
      bio: (user as any)?.bio || "",
    });
  }, [user]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPickedFile(e.target.files?.[0] || null);
  };

  const uploadAvatar = async () => {
    if (!pickedFile) return;
    setError("");
    setAvatarUploading(true);
    try {
      await uploadMyAvatar(pickedFile);
      setPickedFile(null);
      bumpAvatarBuster();
      await fetchProfile(true);
    } catch (e: any) {
      setError(
        String(
          e?.response?.data?.detail || e?.message || "Failed to upload avatar"
        )
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const next = await updateCurrentUser({
        display_name: form.display_name,
        bio: form.bio,
      });
      // Update local user state
      useAuthStore.setState({
        user: { ...user, ...(next as any) } as any,
      });
      bumpAvatarBuster();
      await fetchProfile(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setError(
        String(e?.response?.data?.detail || e?.message || "Failed to save")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-1.5">
          Account
        </p>
        <h2 className="text-2xl font-black text-stone-900 font-serif tracking-tight">
          User Info.
        </h2>
      </div>

      {/* Avatar + identity block */}
      <div className="mb-8 p-6 bg-white rounded-md border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 shrink-0 overflow-hidden rounded-none border-2 border-stone-100">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-none object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-amber-500 text-white text-lg font-bold">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-stone-900 truncate">
              {displayName}
            </p>
            <p className="text-sm text-stone-400 truncate">{email || "—"}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="px-4 py-3 bg-stone-50 rounded-sm border border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-1">
              Username
            </p>
            <p className="text-sm font-semibold text-stone-900 break-all">
              {username || "—"}
            </p>
          </div>
          <div className="px-4 py-3 bg-stone-50 rounded-sm border border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-1">
              Email
            </p>
            <p className="text-sm font-semibold text-stone-900 break-all">
              {email || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="p-6 bg-white rounded-md border border-stone-100 shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2.5">
              Display name
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, display_name: e.target.value }))
              }
              maxLength={50}
              className="w-full px-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2.5">
              Bio
            </label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              maxLength={300}
              className="w-full px-4 py-3 bg-white border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
              placeholder="A short bio about yourself"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-stone-500 mb-2.5">
              Avatar
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
              <button
                type="button"
                onClick={openFilePicker}
                className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 text-xs font-semibold hover:border-stone-300 hover:bg-stone-50 transition-all rounded-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Choose image
              </button>
              <button
                type="button"
                onClick={uploadAvatar}
                disabled={!pickedFile || avatarUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {avatarUploading ? "Uploading…" : "Upload"}
              </button>
              {pickedFileName && (
                <p className="text-xs text-stone-400 break-all">
                  {pickedFileName}
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 py-2 px-3 border border-red-100 bg-red-50 rounded-sm">
              {error}
            </p>
          )}

          {saveSuccess && (
            <p className="text-xs text-emerald-600 py-2 px-3 border border-emerald-100 bg-emerald-50 rounded-sm font-medium">
              Saved successfully!
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="px-5 py-2.5 border border-stone-200 text-stone-600 text-xs font-semibold hover:border-stone-300 hover:bg-stone-50 transition-all rounded-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-5 py-2.5 bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-px active:translate-y-0 rounded-sm"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
