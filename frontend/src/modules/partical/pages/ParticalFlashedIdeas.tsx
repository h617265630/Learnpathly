import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";

type ItemKind = "link" | "document" | "note" | "snippet";

interface ParticalItem {
  id: string;
  kind: ItemKind;
  title: string;
  url?: string;
  content?: string;
  note?: string;
  createdAt: string;
}

const STORAGE_KEY = "partical.items.v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadItems(): ParticalItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeJsonParse<ParticalItem[]>(raw);
    if (!parsed) return [];
    return parsed.filter(
      (i) =>
        typeof i?.id === "string" &&
        typeof i?.kind === "string" &&
        typeof i?.title === "string"
    );
  } catch {
    return [];
  }
}

function persistItems(next: ParticalItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(iso: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function ParticalFlashedIdeas() {
  const [items, setItems] = useState<ParticalItem[]>([]);
  const [draft, setDraft] = useState({
    kind: "link" as ItemKind,
    title: "",
    url: "",
    content: "",
    note: "",
  });

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const canSave = useMemo(() => {
    const titleOk = draft.title.trim().length > 0;
    if (!titleOk) return false;
    if (draft.kind === "link" || draft.kind === "document") {
      return draft.url.trim().length > 0;
    }
    return draft.content.trim().length > 0;
  }, [draft]);

  const saveItem = useCallback(() => {
    if (!canSave) return;
    const now = new Date().toISOString();
    const next: ParticalItem = {
      id: makeId(),
      kind: draft.kind,
      title: draft.title.trim(),
      url: draft.url.trim() || undefined,
      content: draft.content.trim() || undefined,
      note: draft.note.trim() || undefined,
      createdAt: now,
    };
    const updated = [next, ...items];
    setItems(updated);
    persistItems(updated);
    setDraft({ kind: draft.kind, title: "", url: "", content: "", note: "" });
  }, [canSave, draft, items]);

  const removeItem = useCallback(
    (id: string) => {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      persistItems(next);
    },
    [items]
  );

  const documents = useMemo(
    () => items.filter((i) => i.kind === "document" && i.url),
    [items]
  );
  const snippets = useMemo(
    () => items.filter((i) => i.kind === "snippet" && i.content),
    [items]
  );
  const notes = useMemo(
    () => items.filter((i) => i.kind === "note" && i.content),
    [items]
  );
  const links = useMemo(
    () => items.filter((i) => i.kind === "link" && i.url),
    [items]
  );

  return (
    <div className="min-h-[60vh] space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-stone-900">Flashed Ideas</h3>
        <p className="mt-2 text-sm text-stone-500">
          Record your materials: manually fetched URLs / share links, notes, document links, text fragments
        </p>
      </div>

      {/* Add item */}
      <section className="rounded-md border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">New Record</h2>
            <p className="text-sm text-stone-500 mt-1">
              Supports: links / document links / notes / text fragments
            </p>
          </div>
          <Button
            type="button"
            className="rounded-md"
            disabled={!canSave}
            onClick={saveItem}
          >
            Save
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Type
            </label>
            <select
              value={draft.kind}
              onChange={(e) =>
                setDraft({ ...draft, kind: e.target.value as ItemKind })
              }
              className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              <option value="link">Share link / URL</option>
              <option value="document">Document link</option>
              <option value="note">Note</option>
              <option value="snippet">Text fragment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Give it a name for easy search later"
              className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {draft.kind === "link" || draft.kind === "document" ? (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-stone-900 mb-2">
                Link *
              </label>
              <input
                type="url"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          ) : (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-stone-900 mb-2">
                Content *
              </label>
              <textarea
                value={draft.content}
                onChange={(e) =>
                  setDraft({ ...draft, content: e.target.value })
                }
                rows={5}
                placeholder="Paste your note or text fragment here"
                className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
          )}

          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-stone-900 mb-2">
              Note (optional)
            </label>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              rows={2}
              placeholder="Why saved / next steps"
              className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Documents</h2>
          <span className="text-sm text-stone-500">
            {documents.length} items
          </span>
        </div>
        {documents.length === 0 ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
            No document links yet
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((d) => (
              <article
                key={d.id}
                className="bg-white rounded-md border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3
                    className="text-stone-900 font-semibold line-clamp-1"
                    title={d.title}
                  >
                    {d.title}
                  </h3>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-900 underline underline-offset-4 break-all text-sm"
                  >
                    {d.url}
                  </a>
                  {d.note && (
                    <p
                      className="text-stone-500 text-sm mt-1 line-clamp-2"
                      title={d.note}
                    >
                      {d.note}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 mt-1">
                    {formatDate(d.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900">
                    Document
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-md"
                    asChild
                  >
                    <a href={d.url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-md"
                    onClick={() => removeItem(d.id)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Text snippets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Text fragment</h2>
          <span className="text-sm text-stone-500">
            {snippets.length} items
          </span>
        </div>
        {snippets.length === 0 ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
            No text fragments yet
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {snippets.map((t) => (
              <article
                key={t.id}
                className="bg-white rounded-md border border-stone-200 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className="text-stone-900 font-semibold line-clamp-1"
                      title={t.title}
                    >
                      {t.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900">
                    Text
                  </span>
                </div>
                <p className="mt-3 text-stone-500 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                  {t.content}
                </p>
                {t.note && (
                  <p
                    className="mt-3 text-stone-500 text-sm line-clamp-2"
                    title={t.note}
                  >
                    {t.note}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-stone-500">
                    {t.kind === "snippet" ? "Snippet" : "Text"}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-md"
                    onClick={() => removeItem(t.id)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Note</h2>
          <span className="text-sm text-stone-500">{notes.length} items</span>
        </div>
        {notes.length === 0 ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
            No notes yet
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {notes.map((n) => (
              <article
                key={n.id}
                className="bg-white rounded-md border border-stone-200 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className="text-stone-900 font-semibold line-clamp-1"
                      title={n.title}
                    >
                      {n.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900">
                    Note
                  </span>
                </div>
                <p className="mt-3 text-stone-500 text-sm leading-relaxed whitespace-pre-wrap line-clamp-8">
                  {n.content}
                </p>
                {n.note && (
                  <p
                    className="mt-3 text-stone-500 text-sm line-clamp-2"
                    title={n.note}
                  >
                    {n.note}
                  </p>
                )}
                <div className="mt-4 flex items-end justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-md"
                    onClick={() => removeItem(n.id)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Shared links */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Share Links</h2>
          <span className="text-sm text-stone-500">{links.length} items</span>
        </div>
        {links.length === 0 ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
            No share links yet
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((l) => (
              <article
                key={l.id}
                className="bg-white rounded-md border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3
                    className="text-stone-900 font-semibold line-clamp-1"
                    title={l.title}
                  >
                    {l.title}
                  </h3>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-900 underline underline-offset-4 break-all text-sm"
                  >
                    {l.url}
                  </a>
                  {l.note && (
                    <p
                      className="text-stone-500 text-sm mt-1 line-clamp-2"
                      title={l.note}
                    >
                      {l.note}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 mt-1">
                    {formatDate(l.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900">
                    Link
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-md"
                    asChild
                  >
                    <a href={l.url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-md"
                    onClick={() => removeItem(l.id)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
