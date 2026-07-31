"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Asterisk,
  Bold,
  BookOpen,
  CheckCircle,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Plus,
  Quote,
  Redo,
  Scissors,
  Sparkles,
  Strikethrough,
  Trash2,
  Undo,
} from "lucide-react";

import "./epub-studio.css";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type FontStyle = "serif" | "sans";
type Alignment = "justify" | "left" | "center";
type FontSize = "sm" | "md" | "lg" | "xl";

type CoverImage = {
  name: string;
  mimeType: string;
  base64: string;
  width: number;
  height: number;
};

type TitleAlign = "left" | "center" | "right";
type TitleTransform = "none" | "uppercase" | "smallcaps";
type TitleTracking = "normal" | "wide" | "wider";

/**
 * Chapter-title styling is book-wide rather than per-chapter: a novel whose
 * chapter headings drift in size or spacing reads as a formatting error, and
 * KDP reviewers flag it.
 */
type TitleStyle = {
  spaceAbove: number; // em above the title
  spaceBelow: number; // em below the title
  align: TitleAlign;
  size: FontSize;
  font: FontStyle;
  weight: "normal" | "bold";
  transform: TitleTransform;
  tracking: TitleTracking;
  rule: boolean; // hairline beneath the title
};

type Metadata = {
  title: string;
  author: string;
  publisher: string;
  language: string;
  baseFontSize: FontSize;
  fontStyle: FontStyle;
  alignment: Alignment;
  titleStyle: TitleStyle;
  cover: CoverImage | null;
};

type Chapter = {
  id: string;
  title: string;
  content: string;
  dropCap: boolean;
};

type InlineImage = { name: string; mimeType: string; base64: string };
type InlineImages = Record<string, InlineImage>;

type ExportStatus = {
  status: "idle" | "generating" | "success" | "error";
  message: string;
};

/** Autosave state, surfaced as a quiet note in the header. */
type DraftState =
  | "idle"
  | "restored"
  | "saving"
  | "saved"
  | "saved-partial" // text kept, images dropped: over the storage quota
  | "error";

/** Shape written to localStorage. `version` gates forward-incompatible changes. */
type Draft = {
  version: 1;
  savedAt: number;
  metadata: Metadata;
  chapters: Chapter[];
  inlineImages: InlineImages;
  activeChapterId: string;
};

type ParseFn = (
  text: string,
  inlineImages: InlineImages,
  isPreview?: boolean
) => string;

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const KDP_MIN_HEIGHT = 1000;
const KDP_IDEAL_RATIO = 1.6;

/** Autosave slot. Bump the suffix if the Draft shape ever changes. */
const DRAFT_KEY = "epub-studio:draft:v1";
/** Quiet period after the last keystroke before the draft is written. */
const DRAFT_DEBOUNCE_MS = 600;

const SIDEBAR_DEFAULT = 300;
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 560;

const PREVIEW_DEFAULT = 440;
const PREVIEW_MIN = 280;
const PREVIEW_MAX = 760;

const PREVIEW_FONT_SIZES: Record<FontSize, string> = {
  sm: "13px",
  md: "15px",
  lg: "17px",
  xl: "19px",
};

/** Title sizes in em — kept in step with the generator's stylesheet. */
const TITLE_SIZES: Record<FontSize, string> = {
  sm: "1.4em",
  md: "1.8em",
  lg: "2.2em",
  xl: "2.8em",
};

const TITLE_TRACKING: Record<TitleTracking, string> = {
  normal: "0",
  wide: "0.06em",
  wider: "0.12em",
};

/** The defaults reproduce the generator's original hard-coded h1 rule. */
const DEFAULT_TITLE_STYLE: TitleStyle = {
  spaceAbove: 1.8,
  spaceBelow: 1.2,
  align: "center",
  size: "md",
  font: "serif",
  weight: "bold",
  transform: "none",
  tracking: "normal",
  rule: false,
};

/**
 * A tiny inline SVG so the seeded chapter can demonstrate the image syntax
 * without shipping a binary asset. Percent-encoded rather than base64 so it
 * stays readable — the generator decodes both forms.
 */
const DEMO_IMAGE = `data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='420' viewBox='0 0 900 420'%3E%3Crect width='900' height='420' fill='rgb(240,235,225)'/%3E%3Cpath d='M0 320 L180 220 L330 300 L520 170 L690 260 L900 150 L900 420 L0 420 Z' fill='rgb(196,186,170)'/%3E%3Cpath d='M0 360 L210 285 L400 345 L600 250 L780 320 L900 265 L900 420 L0 420 Z' fill='rgb(150,140,124)'/%3E%3Ccircle cx='720' cy='95' r='42' fill='rgb(219,206,182)'/%3E%3C/svg%3E`;

const DEMO_CHAPTER_CONTENT = `The harbour had emptied by the time she reached it, and only the tide kept working. Rope creaked against the bollards. Somewhere behind the customs house a dog was barking at nothing at all, the way dogs do when a town is about to change hands.

She had packed for a week and planned for a year, which is the usual ratio of hope to luggage.

[center]THE FIRST CROSSING[/center]

![The harbour at first light](img:img-demo)

"You could still turn back," he said, not looking at her. "Nobody would count it against you."

"*Nobody* is not who I'd be answering to."

[scenebreak]

The gangway took her weight without complaint. Below, the water folded and unfolded itself, patient as a **letter that has waited years to be opened**, and she thought — briefly, and then not again for a very long time — of the road home.

> Travel is only ever an argument with the person you were yesterday.

[pagebreak]

# The Manifest

By morning the coast was a rumour and the ship had settled into its own weather.`;

const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: "ch-1",
    title: "Chapter 1: The Departure",
    content: DEMO_CHAPTER_CONTENT,
    dropCap: true,
  },
];

const INITIAL_INLINE_IMAGES: InlineImages = {
  "img-demo": {
    name: "harbour.svg",
    mimeType: "image/svg+xml",
    base64: DEMO_IMAGE,
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Resolves with zeroes instead of rejecting: an unmeasurable cover still
 * exports fine, just via the plain <img> fallback path in the generator.
 */
function readImageDimensions(
  dataUri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    // `window.Image` is required: the lucide `Image` icon shadows the global.
    const probe = new window.Image();
    probe.onload = () =>
      resolve({ width: probe.naturalWidth, height: probe.naturalHeight });
    probe.onerror = () => resolve({ width: 0, height: 0 });
    probe.src = dataUri;
  });
}

/** KDP cover advice — advisory only, never blocks an export. */
function coverWarning(cover: CoverImage): string | null {
  if (!cover.width || !cover.height) return null;
  if (cover.height < KDP_MIN_HEIGHT) {
    return "Low resolution for KDP (needs 1000px tall minimum).";
  }
  if (Math.abs(cover.height / cover.width - KDP_IDEAL_RATIO) > 0.15) {
    return "Unusual aspect ratio — KDP recommends 1:1.6 (e.g. 1600 x 2560).";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function EpubStudio() {
  const [metadata, setMetadata] = useState<Metadata>({
    title: "My Epic Novel",
    author: "Author Name",
    publisher: "Self-Published",
    language: "en",
    baseFontSize: "md",
    fontStyle: "serif",
    alignment: "justify",
    titleStyle: DEFAULT_TITLE_STYLE,
    cover: null,
  });

  const [chapters, setChapters] = useState<Chapter[]>(INITIAL_CHAPTERS);
  const [inlineImages, setInlineImages] = useState<InlineImages>(
    INITIAL_INLINE_IMAGES
  );
  const [activeChapterId, setActiveChapterId] = useState("ch-1");
  const [activeTab, setActiveTab] = useState<"chapters" | "metadata">(
    "chapters"
  );
  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    status: "idle",
    message: "",
  });

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [previewWidth, setPreviewWidth] = useState(PREVIEW_DEFAULT);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  // Where to drop an inserted image: the caret is captured before the OS file
  // picker steals focus from the textarea.
  const pendingCaretRef = useRef(0);

  const activeChapter =
    chapters.find((c) => c.id === activeChapterId) ?? chapters[0] ?? null;

  /* ---------- parser (shares the generator's chunk) ---------- */

  // The generator pulls in JSZip, so it is loaded as its own chunk rather than
  // bundled into the page. The preview needs the parser from that same module,
  // so it is fetched once after mount.
  const [parse, setParse] = useState<ParseFn | null>(null);
  useEffect(() => {
    let alive = true;
    import("./epubGenerator").then((mod) => {
      if (alive) setParse(() => mod.parseContentToHTML as ParseFn);
    });
    return () => {
      alive = false;
    };
  }, []);

  const previewHtml = useMemo(() => {
    if (!parse || !activeChapter) return "";
    return parse(activeChapter.content, inlineImages, true);
  }, [parse, activeChapter, inlineImages]);

  /* ---------- draft autosave ---------- */

  const [draftState, setDraftState] = useState<DraftState>("idle");
  // Guards the save effect: until the stored draft has been read, writing
  // would overwrite the user's work with the seeded demo book.
  const [draftLoaded, setDraftLoaded] = useState(false);
  // Restoring a draft shouldn't immediately rewrite it — nothing has changed
  // yet, and the pass would replace "Draft restored" with "Draft saved" before
  // the user has read it.
  const skipFirstSaveRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        if (draft?.version === 1 && Array.isArray(draft.chapters)) {
          if (draft.metadata) {
            setMetadata((prev) => ({
              ...prev,
              ...draft.metadata,
              // A draft written before a setting existed must still get a
              // complete titleStyle, or the controls read undefined.
              titleStyle: {
                ...DEFAULT_TITLE_STYLE,
                ...(draft.metadata.titleStyle ?? {}),
              },
            }));
          }
          if (draft.chapters.length) setChapters(draft.chapters);
          setInlineImages(draft.inlineImages ?? {});
          if (draft.chapters.some((c) => c.id === draft.activeChapterId)) {
            setActiveChapterId(draft.activeChapterId);
          } else {
            setActiveChapterId(draft.chapters[0].id);
          }
          skipFirstSaveRef.current = true;
          setDraftState("restored");
        }
      }
    } catch {
      // A corrupt or unreadable draft must never block the tool; start fresh.
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    if (skipFirstSaveRef.current) {
      skipFirstSaveRef.current = false;
      return;
    }
    setDraftState("saving");

    const timer = setTimeout(() => {
      const draft: Draft = {
        version: 1,
        savedAt: Date.now(),
        metadata,
        chapters,
        inlineImages,
        activeChapterId,
      };

      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftState("saved");
      } catch {
        // Images are data URIs and a cover alone can exceed the ~5MB quota.
        // Losing the manuscript matters far more than losing the pictures, so
        // fall back to a text-only draft and say so.
        try {
          const lean: Draft = {
            ...draft,
            metadata: { ...metadata, cover: null },
            inlineImages: {},
          };
          window.localStorage.setItem(DRAFT_KEY, JSON.stringify(lean));
          setDraftState("saved-partial");
        } catch {
          setDraftState("error");
        }
      }
    }, DRAFT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draftLoaded, metadata, chapters, inlineImages, activeChapterId]);

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to clean up */
    }
  };

  /** Wipes the draft and returns the workspace to a fresh book. */
  const startNewBook = () => {
    const confirmed = window.confirm(
      "Discard this book and start over? Anything you have not exported will be lost."
    );
    if (!confirmed) return;
    clearDraft();
    setMetadata({
      title: "My Epic Novel",
      author: "Author Name",
      publisher: "Self-Published",
      language: "en",
      baseFontSize: "md",
      fontStyle: "serif",
      alignment: "justify",
      titleStyle: DEFAULT_TITLE_STYLE,
      cover: null,
    });
    setChapters(INITIAL_CHAPTERS);
    setInlineImages(INITIAL_INLINE_IMAGES);
    setActiveChapterId("ch-1");
    setDraftState("idle");
  };

  /* ---------- transient status ---------- */

  useEffect(() => {
    if (exportStatus.status !== "success" && exportStatus.status !== "error") {
      return;
    }
    const t = setTimeout(
      () => setExportStatus({ status: "idle", message: "" }),
      4000
    );
    return () => clearTimeout(t);
  }, [exportStatus]);

  /* ---------- chapter operations ---------- */

  const updateChapter = useCallback(
    (id: string, patch: Partial<Chapter>) => {
      setChapters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const patchTitleStyle = (patch: Partial<TitleStyle>) =>
    setMetadata((prev) => ({
      ...prev,
      titleStyle: { ...prev.titleStyle, ...patch },
    }));

  const addChapter = () => {
    const chapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: `Chapter ${chapters.length + 1}`,
      content: "Start writing this chapter...",
      dropCap: false,
    };
    setChapters((prev) => [...prev, chapter]);
    setActiveChapterId(chapter.id);
  };

  const moveChapter = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    setChapters((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const deleteChapter = (id: string) => {
    // A book must keep at least one chapter.
    if (chapters.length <= 1) return;
    const index = chapters.findIndex((c) => c.id === id);
    const next = chapters.filter((c) => c.id !== id);
    setChapters(next);
    if (id === activeChapterId) {
      setActiveChapterId(next[Math.max(0, index - 1)].id);
    }
  };

  /* ---------- column resizing ---------- */

  const startResize = (edge: "sidebar" | "preview") => (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSidebar = sidebarWidth;
    const startPreview = previewWidth;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      if (edge === "sidebar") {
        setSidebarWidth(
          Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startSidebar + delta))
        );
      } else {
        // Dragging right widens the editor and narrows the preview.
        setPreviewWidth(
          Math.min(PREVIEW_MAX, Math.max(PREVIEW_MIN, startPreview - delta))
        );
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  /* ---------- editor insertion ---------- */

  /**
   * Wraps the current selection. `execCommand('insertText')` is deprecated but
   * deliberate: it keeps the textarea's *native* undo stack intact, which a
   * setState rewrite would destroy. The catch falls back to React state.
   */
  const wrapSelection = (before: string, after = "") => {
    const ta = textareaRef.current;
    if (!ta || !activeChapter) return;

    ta.focus();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const text = before + selected + after;

    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, text);
    } catch {
      inserted = false;
    }
    if (!inserted) {
      updateChapter(activeChapter.id, {
        content: ta.value.slice(0, start) + text + ta.value.slice(end),
      });
    }

    const caret = start + before.length;
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret + selected.length);
    }, 0);
  };

  const execHistory = (command: "undo" | "redo") => {
    textareaRef.current?.focus();
    try {
      document.execCommand(command);
    } catch {
      /* nothing sensible to fall back to */
    }
  };

  /* ---------- cover image ---------- */

  const applyCover = async (file: {
    fileName: string;
    mimeType: string;
    base64: string;
  }) => {
    const { width, height } = await readImageDimensions(file.base64);
    setMetadata((prev) => ({
      ...prev,
      cover: {
        name: file.fileName,
        mimeType: file.mimeType,
        base64: file.base64,
        width,
        height,
      },
    }));
  };

  const handleCoverInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      applyCover({
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        base64: reader.result as string,
      });
    reader.onerror = () =>
      setExportStatus({
        status: "error",
        message: "Failed to read cover image.",
      });
    reader.readAsDataURL(file);
  };

  /* ---------- inline images ---------- */

  const openInlineImagePicker = () => {
    pendingCaretRef.current = textareaRef.current?.selectionStart ?? 0;
    inlineInputRef.current?.click();
  };

  const handleInlineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeChapter) return;

    const reader = new FileReader();
    reader.onload = () => {
      const id = `img-${Date.now()}`;
      setInlineImages((prev) => ({
        ...prev,
        [id]: {
          name: file.name,
          mimeType: file.type || "image/jpeg",
          base64: reader.result as string,
        },
      }));

      const caption = file.name.replace(/\.[^.]+$/, "");
      const ta = textareaRef.current;
      if (ta) {
        const caret = Math.min(pendingCaretRef.current, ta.value.length);
        ta.focus();
        ta.setSelectionRange(caret, caret);
        wrapSelection(`\n\n![${caption}](img:${id})\n\n`);
      } else {
        updateChapter(activeChapter.id, {
          content: `${activeChapter.content}\n\n![${caption}](img:${id})\n\n`,
        });
      }
    };
    reader.onerror = () =>
      setExportStatus({ status: "error", message: "Failed to read image." });
    reader.readAsDataURL(file);
  };

  /* ---------- export ---------- */

  const handleExport = async () => {
    setExportStatus({ status: "generating", message: "Building EPUB…" });
    try {
      const { generateEPUB } = await import("./epubGenerator");
      const arrayBuffer = await generateEPUB(metadata, chapters, inlineImages);
      const blob = new Blob([arrayBuffer], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(metadata.title || "untitled")
        .toLowerCase()
        .replace(/\s+/g, "-")}.epub`;
      a.click();
      URL.revokeObjectURL(url);
      // The book is now a file on disk, so the draft has done its job. The
      // workspace keeps its contents — only the saved copy is dropped.
      clearDraft();
      setDraftState("idle");
      setExportStatus({ status: "success", message: "EPUB downloaded" });
    } catch (err) {
      console.error(err);
      setExportStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Export failed",
      });
    }
  };

  /* ---------- render ---------- */

  const warning = metadata.cover ? coverWarning(metadata.cover) : null;
  const titleStyle = metadata.titleStyle;

  // Mirrors the h1 rule the generator emits, so the preview and the exported
  // book agree. The em margins resolve against the title's own font size in
  // both places.
  const previewTitleStyle: React.CSSProperties = {
    marginTop: `${titleStyle.spaceAbove}em`,
    marginBottom: `${titleStyle.spaceBelow}em`,
    textAlign: titleStyle.align,
    fontFamily:
      titleStyle.font === "sans"
        ? "var(--font-montserrat), system-ui, sans-serif"
        : "var(--font-lora), Georgia, serif",
    fontSize: TITLE_SIZES[titleStyle.size],
    fontWeight: titleStyle.weight === "normal" ? 400 : 700,
    letterSpacing: TITLE_TRACKING[titleStyle.tracking],
    textTransform: titleStyle.transform === "uppercase" ? "uppercase" : "none",
    fontVariant:
      titleStyle.transform === "smallcaps" ? "small-caps" : "normal",
    borderBottom: titleStyle.rule ? "1px solid rgba(39, 33, 28, 0.35)" : "none",
    paddingBottom: titleStyle.rule ? "0.4em" : 0,
  };

  return (
    <div className="epub-studio">
      {/* Hidden pickers replace the desktop build's Electron file dialogs. */}
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverInputChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={inlineInputRef}
        onChange={handleInlineInputChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
      />

      <header className="studio-header">
        <div className="studio-brand">
          <BookOpen size={19} className="brand-icon" aria-hidden="true" />
          {/* A span, not a heading: the page's real h1 lives in page.tsx, and
              two h1s on one page is a needless SEO and a11y wart. */}
          <span className="studio-title">EPUB Studio</span>
          <span className="badge-kdp">KDP-Optimized</span>
        </div>

        <div className="studio-actions">
          {draftState !== "idle" && (
            <span
              className={`draft-note ${
                draftState === "saved-partial" || draftState === "error"
                  ? "warn"
                  : ""
              }`}
              title="Your work is kept in this browser until you export it."
            >
              {draftState === "saving" && "Saving…"}
              {draftState === "saved" && "Draft saved"}
              {draftState === "restored" && "Draft restored"}
              {draftState === "saved-partial" && "Saved — images too large"}
              {draftState === "error" && "Could not save draft"}
            </span>
          )}

          {exportStatus.status !== "idle" && (
            <div
              className={`status-toast ${exportStatus.status}`}
              role="status"
              aria-live="polite"
            >
              {exportStatus.status === "generating" && (
                <span className="status-dot" aria-hidden="true" />
              )}
              {exportStatus.status === "success" && (
                <CheckCircle size={14} aria-hidden="true" />
              )}
              {exportStatus.status === "error" && (
                <AlertCircle size={14} aria-hidden="true" />
              )}
              <span>{exportStatus.message}</span>
            </div>
          )}

          <button
            type="button"
            className="btn-export"
            onClick={handleExport}
            disabled={exportStatus.status === "generating"}
          >
            <Sparkles size={15} aria-hidden="true" />
            Export EPUB
          </button>
        </div>
      </header>

      <div className="workspace">
        {/* ---------------- Sidebar ---------------- */}
        <aside className="sidebar-panel" style={{ width: sidebarWidth }}>
          <div className="sidebar-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "chapters"}
              className={`sidebar-tab ${activeTab === "chapters" ? "active" : ""}`}
              onClick={() => setActiveTab("chapters")}
            >
              Chapters ({chapters.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "metadata"}
              className={`sidebar-tab ${activeTab === "metadata" ? "active" : ""}`}
              onClick={() => setActiveTab("metadata")}
            >
              Settings
            </button>
          </div>

          <div className="sidebar-scroll">
            {activeTab === "chapters" ? (
              <>
                <button
                  type="button"
                  className="btn-add-chapter"
                  onClick={addChapter}
                >
                  <Plus size={15} aria-hidden="true" />
                  Add Chapter
                </button>

                <div className="chapter-list">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveChapterId(chapter.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveChapterId(chapter.id);
                        }
                      }}
                      className={`chapter-card ${
                        chapter.id === activeChapterId ? "active" : ""
                      }`}
                    >
                      <span className="chapter-card-body">
                        <span className="chapter-index">
                          Chapter {index + 1}
                        </span>
                        <span className="chapter-name">{chapter.title}</span>
                      </span>

                      <span className="chapter-row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Move ${chapter.title} up`}
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveChapter(index, -1);
                          }}
                        >
                          <ArrowUp size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Move ${chapter.title} down`}
                          disabled={index === chapters.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveChapter(index, 1);
                          }}
                        >
                          <ArrowDown size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label={`Delete ${chapter.title}`}
                          disabled={chapters.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChapter(chapter.id);
                          }}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* --- Cover image --- */}
                <div className="settings-group">
                  <span className="settings-label">Cover Image</span>

                  {metadata.cover ? (
                    <>
                      <div className="cover-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="cover-thumb"
                          src={metadata.cover.base64}
                          alt="Cover preview"
                        />
                        <span className="cover-meta">
                          <span className="cover-file">
                            {metadata.cover.name}
                          </span>
                          <span className="cover-dims">
                            {metadata.cover.width} × {metadata.cover.height} px
                          </span>
                        </span>
                      </div>

                      <div className="cover-buttons">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() =>
                            setMetadata((prev) => ({ ...prev, cover: null }))
                          }
                        >
                          Remove
                        </button>
                      </div>

                      {warning && (
                        <p className="cover-warning">
                          <AlertCircle size={13} aria-hidden="true" />
                          <span>{warning}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <ImageIcon size={15} aria-hidden="true" />
                      Add Cover Image
                    </button>
                  )}
                </div>

                {/* --- Metadata --- */}
                <div className="settings-group">
                  <span className="settings-label">Ebook Metadata</span>

                  <div className="field">
                    <label className="field-label" htmlFor="es-title">
                      Novel Title
                    </label>
                    <input
                      id="es-title"
                      className="text-input"
                      value={metadata.title}
                      onChange={(e) =>
                        setMetadata((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="es-author">
                      Author Name
                    </label>
                    <input
                      id="es-author"
                      className="text-input"
                      value={metadata.author}
                      onChange={(e) =>
                        setMetadata((prev) => ({
                          ...prev,
                          author: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="es-publisher">
                      Publisher
                    </label>
                    <input
                      id="es-publisher"
                      className="text-input"
                      value={metadata.publisher}
                      onChange={(e) =>
                        setMetadata((prev) => ({
                          ...prev,
                          publisher: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" htmlFor="es-language">
                      Language Code
                    </label>
                    <input
                      id="es-language"
                      className="text-input"
                      placeholder="en"
                      value={metadata.language}
                      onChange={(e) =>
                        setMetadata((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* --- Styling --- */}
                <div className="settings-group">
                  <span className="settings-label">Ebook Styling</span>

                  <div className="field">
                    <span className="field-label">Font Family</span>
                    <div className="option-grid cols-2">
                      {(
                        [
                          ["serif", "Lora Serif"],
                          ["sans", "Inter Sans"],
                        ] as [FontStyle, string][]
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`option-btn ${
                            metadata.fontStyle === value ? "active" : ""
                          }`}
                          onClick={() =>
                            setMetadata((prev) => ({
                              ...prev,
                              fontStyle: value,
                            }))
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Novel Alignment</span>
                    <div className="option-grid cols-3">
                      {(
                        [
                          ["justify", AlignJustify, "Justify"],
                          ["left", AlignLeft, "Left"],
                          ["center", AlignCenter, "Center"],
                        ] as [Alignment, typeof AlignJustify, string][]
                      ).map(([value, Icon, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-label={label}
                          className={`option-btn ${
                            metadata.alignment === value ? "active" : ""
                          }`}
                          onClick={() =>
                            setMetadata((prev) => ({
                              ...prev,
                              alignment: value,
                            }))
                          }
                        >
                          <Icon size={15} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Scale Font Size</span>
                    <div className="option-grid cols-4">
                      {(["sm", "md", "lg", "xl"] as FontSize[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`option-btn ${
                            metadata.baseFontSize === value ? "active" : ""
                          }`}
                          onClick={() =>
                            setMetadata((prev) => ({
                              ...prev,
                              baseFontSize: value,
                            }))
                          }
                        >
                          {value.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- Chapter titles --- */}
                <div className="settings-group">
                  <div className="settings-head">
                    <span className="settings-label">Chapter Titles</span>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() =>
                        patchTitleStyle({ ...DEFAULT_TITLE_STYLE })
                      }
                    >
                      Reset
                    </button>
                  </div>

                  <div className="field">
                    <span className="field-label">
                      Space Above
                      <span className="field-value">
                        {titleStyle.spaceAbove.toFixed(1)}em
                      </span>
                    </span>
                    <input
                      type="range"
                      className="slider"
                      min={0}
                      max={8}
                      step={0.1}
                      value={titleStyle.spaceAbove}
                      aria-label="Space above chapter title"
                      onChange={(e) =>
                        patchTitleStyle({ spaceAbove: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="field">
                    <span className="field-label">
                      Space Below
                      <span className="field-value">
                        {titleStyle.spaceBelow.toFixed(1)}em
                      </span>
                    </span>
                    <input
                      type="range"
                      className="slider"
                      min={0}
                      max={6}
                      step={0.1}
                      value={titleStyle.spaceBelow}
                      aria-label="Space below chapter title"
                      onChange={(e) =>
                        patchTitleStyle({ spaceBelow: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="field">
                    <span className="field-label">Title Size</span>
                    <div className="option-grid cols-4">
                      {(["sm", "md", "lg", "xl"] as FontSize[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`option-btn ${
                            titleStyle.size === value ? "active" : ""
                          }`}
                          onClick={() => patchTitleStyle({ size: value })}
                        >
                          {value.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Title Alignment</span>
                    <div className="option-grid cols-3">
                      {(
                        [
                          ["left", AlignLeft, "Left"],
                          ["center", AlignCenter, "Center"],
                          ["right", AlignRight, "Right"],
                        ] as [TitleAlign, typeof AlignLeft, string][]
                      ).map(([value, Icon, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-label={`${label} aligned title`}
                          className={`option-btn ${
                            titleStyle.align === value ? "active" : ""
                          }`}
                          onClick={() => patchTitleStyle({ align: value })}
                        >
                          <Icon size={15} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Title Font</span>
                    <div className="option-grid cols-2">
                      {(
                        [
                          ["serif", "Serif"],
                          ["sans", "Sans"],
                        ] as [FontStyle, string][]
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`option-btn ${
                            titleStyle.font === value ? "active" : ""
                          }`}
                          onClick={() => patchTitleStyle({ font: value })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Title Weight</span>
                    <div className="option-grid cols-2">
                      {(
                        [
                          ["normal", "Regular"],
                          ["bold", "Bold"],
                        ] as [TitleStyle["weight"], string][]
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`option-btn ${
                            titleStyle.weight === value ? "active" : ""
                          }`}
                          onClick={() => patchTitleStyle({ weight: value })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Letter Case</span>
                    <div className="option-grid cols-3">
                      {(
                        [
                          ["none", "Normal"],
                          ["uppercase", "UPPER"],
                          ["smallcaps", "Small Caps"],
                        ] as [TitleTransform, string][]
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`option-btn ${
                            titleStyle.transform === value ? "active" : ""
                          }`}
                          onClick={() => patchTitleStyle({ transform: value })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <span className="field-label">Letter Spacing</span>
                    <div className="option-grid cols-3">
                      {(
                        [
                          ["normal", "Normal"],
                          ["wide", "Wide"],
                          ["wider", "Widest"],
                        ] as [TitleTracking, string][]
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`option-btn ${
                            titleStyle.tracking === value ? "active" : ""
                          }`}
                          onClick={() => patchTitleStyle({ tracking: value })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="switch-label switch-row"
                    aria-pressed={titleStyle.rule}
                    onClick={() => patchTitleStyle({ rule: !titleStyle.rule })}
                  >
                    <span
                      className={`switch ${titleStyle.rule ? "on" : ""}`}
                      aria-hidden="true"
                    />
                    Rule beneath title
                  </button>
                </div>

                {/* --- Draft --- */}
                <div className="settings-group">
                  <span className="settings-label">Draft</span>
                  <p className="settings-hint">
                    Your book is kept in this browser as you work, so a refresh
                    won&apos;t lose it. Exporting clears the saved copy.
                  </p>
                  <button
                    type="button"
                    className="btn-outline danger"
                    onClick={startNewBook}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Start a new book
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        <div
          className="resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chapter sidebar"
          onMouseDown={startResize("sidebar")}
        />

        {/* ---------------- Editor ---------------- */}
        <section className="editor-panel">
          {activeChapter ? (
            <>
              <input
                className="chapter-title-input"
                value={activeChapter.title}
                placeholder="Chapter Title..."
                aria-label="Chapter title"
                onChange={(e) =>
                  updateChapter(activeChapter.id, { title: e.target.value })
                }
              />

              <div className="toolbar">
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Undo"
                  title="Undo"
                  onClick={() => execHistory("undo")}
                >
                  <Undo size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Redo"
                  title="Redo"
                  onClick={() => execHistory("redo")}
                >
                  <Redo size={15} aria-hidden="true" />
                </button>

                <span className="toolbar-divider" aria-hidden="true" />

                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Bold"
                  title="Bold"
                  onClick={() => wrapSelection("**", "**")}
                >
                  <Bold size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Italic"
                  title="Italic"
                  onClick={() => wrapSelection("*", "*")}
                >
                  <Italic size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Strikethrough"
                  title="Strikethrough"
                  onClick={() => wrapSelection("~~", "~~")}
                >
                  <Strikethrough size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Center block"
                  title="Center block"
                  onClick={() => wrapSelection("[center]", "[/center]")}
                >
                  <AlignCenter size={15} aria-hidden="true" />
                </button>

                <span className="toolbar-divider" aria-hidden="true" />

                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Heading"
                  title="Heading"
                  onClick={() => wrapSelection("\n\n# ", "\n\n")}
                >
                  <Heading1 size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Subheading"
                  title="Subheading"
                  onClick={() => wrapSelection("\n\n## ", "\n\n")}
                >
                  <Heading2 size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Blockquote"
                  title="Blockquote"
                  onClick={() => wrapSelection("\n\n> ", "\n\n")}
                >
                  <Quote size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Scene break"
                  title="Scene break"
                  onClick={() => wrapSelection("\n\n[scenebreak]\n\n")}
                >
                  <Asterisk size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-label="Page break"
                  title="Page break"
                  onClick={() => wrapSelection("\n\n[pagebreak]\n\n")}
                >
                  <Scissors size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="toolbar-btn accent"
                  aria-label="Insert image"
                  title="Insert image"
                  onClick={openInlineImagePicker}
                >
                  <ImageIcon size={15} aria-hidden="true" />
                </button>

                <span className="toolbar-spacer" />

                <button
                  type="button"
                  className="switch-label"
                  aria-pressed={activeChapter.dropCap}
                  onClick={() =>
                    updateChapter(activeChapter.id, {
                      dropCap: !activeChapter.dropCap,
                    })
                  }
                >
                  <span
                    className={`switch ${activeChapter.dropCap ? "on" : ""}`}
                    aria-hidden="true"
                  />
                  Drop Cap First Letter
                </button>
              </div>

              <textarea
                ref={textareaRef}
                className="editor-textarea"
                aria-label="Chapter content"
                spellCheck
                value={activeChapter.content}
                onChange={(e) =>
                  updateChapter(activeChapter.id, { content: e.target.value })
                }
              />
            </>
          ) : (
            <p className="empty-editor">No chapter selected.</p>
          )}
        </section>

        <div
          className="resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize preview"
          onMouseDown={startResize("preview")}
        />

        {/* ---------------- Preview ---------------- */}
        <section className="preview-panel" style={{ width: previewWidth }}>
          <div className="preview-head">
            <h2>Live Preview</h2>
            <p>Simulating Kindle Paper</p>
          </div>

          <div className="book-device">
            <div
              className={`book-screen font-${metadata.fontStyle} align-${
                metadata.alignment
              } ${activeChapter?.dropCap ? "has-drop-cap" : ""}`}
              style={
                {
                  "--preview-font-size":
                    PREVIEW_FONT_SIZES[metadata.baseFontSize],
                } as React.CSSProperties
              }
            >
              {activeChapter && (
                <>
                  <h3 className="preview-title" style={previewTitleStyle}>
                    {activeChapter.title}
                  </h3>
                  <div
                    className="preview-body"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
