import { useRef } from "react";

export type CoverPickerProps = {
  coverImageUrl: string;
  defaultCoverUrls: string[];
  uploadedCoverUrl: string;
  accentColor?: string;
  onSelectCover: (url: string) => void;
  onCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function CoverPicker({
  coverImageUrl,
  defaultCoverUrls,
  uploadedCoverUrl,
  accentColor = "amber",
  onSelectCover,
  onCoverFileChange,
}: CoverPickerProps) {
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const borderColor = accentColor === "sky" ? "border-sky-500" : "border-amber-500";

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
        Cover
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* Preview */}
        <div className="rounded-sm overflow-hidden border border-stone-100">
          <div className="aspect-video bg-stone-100">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="w-full h-full object-contain"
                style={{
                  objectFit: "contain",
                  backgroundColor: "#f7f7f7",
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-stone-300"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-2 bg-stone-50/50 text-center">
            <p className="text-[10px] text-stone-400">Current cover</p>
          </div>
        </div>
        {/* Grid of defaults or uploaded */}
        <div className="space-y-2">
          {uploadedCoverUrl ? (
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                className={`rounded-sm overflow-hidden border-2 transition-all ${
                  coverImageUrl === uploadedCoverUrl
                    ? borderColor
                    : "border-stone-200 hover:border-stone-300"
                }`}
                onClick={() => onSelectCover(uploadedCoverUrl)}
              >
                <div className="aspect-video bg-stone-100">
                  <img
                    src={uploadedCoverUrl}
                    alt="Uploaded"
                    className="w-full h-full object-contain"
                    style={{
                      objectFit: "contain",
                      backgroundColor: "#f7f7f7",
                    }}
                  />
                </div>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {defaultCoverUrls.map((u, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`rounded-sm overflow-hidden border-2 transition-all ${
                    coverImageUrl === u
                      ? borderColor
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                  onClick={() => onSelectCover(u)}
                >
                  <div className="aspect-video bg-stone-100">
                    <img
                      src={u}
                      alt={`Cover ${idx + 1}`}
                      className="w-full h-full object-contain"
                      style={{
                        objectFit: "contain",
                        backgroundColor: "#f7f7f7",
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onCoverFileChange}
          />
          <button
            type="button"
            className="w-full h-9 rounded-sm border border-dashed border-stone-300 bg-white text-xs font-semibold text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all flex items-center justify-center gap-1.5"
            onClick={() => coverFileInputRef.current?.click()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
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
            Upload image
          </button>
        </div>
      </div>
    </div>
  );
}
