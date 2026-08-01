"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  Crop,
  Download,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Palette,
  Plus,
  RotateCcw,
  Trash2,
  Type as TypeIcon,
  Upload,
} from "lucide-react";

import { COVER_FONTS, FONT_CATEGORIES, getFont } from "./fonts";
import { COVER_STYLES, styleForRole, type CoverStyle } from "./coverStyles";
import {
  clamp,
  ensureFontsLoaded,
  hitTest,
  renderCover,
  type LayerBox,
} from "./render";
import { clearDraft, loadDraft, saveDraft } from "./storage";
import {
  CANVAS_PRESETS,
  createDefaultDoc,
  createLayer,
  ROLE_LABELS,
  type CoverDoc,
  type ImageFit,
  type LayerRole,
  type ScrimStyle,
  type TextAlign,
  type TextLayer,
  type TextTransform,
} from "./types";

import "./cover-designer.css";

type Tab = "canvas" | "text" | "styles";
type ExportFormat = "png" | "jpeg";
type Status = { state: "idle" | "busy" | "ok" | "error"; message: string };

/** Autosave state, surfaced as a quiet note in the header. */
type DraftState =
  | "idle"
  | "restored"
  | "saving"
  | "saved"
  | "saved-partial" // type kept, image dropped: no IndexedDB in this browser
  | "error";

const DRAFT_DEBOUNCE_MS = 700;

/** Colours a cover actually uses — near-whites, papers, metals and inks. */
const SWATCHES = [
  "#FFFFFF",
  "#F4EFE6",
  "#E8D9B5",
  "#D9B96A",
  "#C9A227",
  "#E4372E",
  "#B9302B",
  "#7FE7F5",
  "#5AC8C0",
  "#B79BFF",
  "#8A94A6",
  "#101828",
  "#000000",
];

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

/** Rounds an arbitrary weight onto the ones the chosen face actually ships. */
function nearestWeight(weights: number[], want: number): number {
  return weights.reduce((best, w) =>
    Math.abs(w - want) < Math.abs(best - want) ? w : best
  );
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "book-cover"
  );
}

export default function CoverDesigner() {
  const [doc, setDoc] = useState<CoverDoc>(createDefaultDoc);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("canvas");
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [status, setStatus] = useState<Status>({ state: "idle", message: "" });
  const [guides, setGuides] = useState({ x: false, y: false });
  const [dragOver, setDragOver] = useState(false);
  const [draftState, setDraftState] = useState<DraftState>("idle");
  const [draftLoaded, setDraftLoaded] = useState(false);
  /** Bumped whenever something outside React state should force a repaint. */
  const [tick, setTick] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const boxesRef = useRef<Map<string, LayerBox>>(new Map());
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    layerX: number;
    layerY: number;
    halfHeightFraction: number;
  } | null>(null);
  /** The restored document must not immediately overwrite itself. */
  const skipFirstSaveRef = useRef(false);

  const [stage, setStage] = useState({ width: 0, height: 0 });

  const selected = useMemo(
    () => doc.layers.find((l) => l.id === selectedId) ?? null,
    [doc.layers, selectedId]
  );

  /* ------------------------------------------------------------------ */
  /* Document helpers                                                    */
  /* ------------------------------------------------------------------ */

  const patchDoc = useCallback((patch: Partial<CoverDoc>) => {
    setDoc((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchLayer = useCallback((id: string, patch: Partial<TextLayer>) => {
    setDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }, []);

  const patchSelected = useCallback(
    (patch: Partial<TextLayer>) => {
      if (selectedId) patchLayer(selectedId, patch);
    },
    [patchLayer, selectedId]
  );

  /* ------------------------------------------------------------------ */
  /* Draft: restore on load, autosave on change                          */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    loadDraft()
      .then((draft) => {
        if (cancelled || !draft) return;

        setDoc(draft.doc);
        setDraftState(draft.imageDropped ? "saved-partial" : "restored");
        skipFirstSaveRef.current = true;

        // The <img> the canvas draws from is not part of the document, so it
        // has to be rebuilt from the stored data URI.
        if (draft.doc.image) {
          const img = new Image();
          img.onload = () => {
            if (cancelled) return;
            imageRef.current = img;
            setTick((t) => t + 1);
          };
          img.src = draft.doc.image.src;
        }
      })
      .finally(() => {
        if (!cancelled) setDraftLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    if (skipFirstSaveRef.current) {
      skipFirstSaveRef.current = false;
      return;
    }

    setDraftState("saving");
    const timer = setTimeout(() => {
      saveDraft(doc)
        .then((result) =>
          setDraftState(result === "full" ? "saved" : "saved-partial")
        )
        .catch(() => setDraftState("error"));
    }, DRAFT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [doc, draftLoaded]);

  /* ------------------------------------------------------------------ */
  /* Fonts                                                               */
  /* ------------------------------------------------------------------ */

  // Canvas draws in a system font if the face has not arrived yet, so wait for
  // the files and repaint once they land.
  const fontKey = doc.layers
    .map((l) => `${l.fontId}:${l.weight}:${l.italic ? "i" : "n"}`)
    .join("|");

  useEffect(() => {
    let cancelled = false;
    ensureFontsLoaded(doc.layers).then(() => {
      if (!cancelled) setTick((t) => t + 1);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontKey]);

  /* ------------------------------------------------------------------ */
  /* Preview sizing                                                      */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStage({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const preview = useMemo(() => {
    const padding = 32;
    const availableW = Math.max(120, stage.width - padding);
    const availableH = Math.max(160, stage.height - padding);
    const scale = Math.min(availableW / doc.width, availableH / doc.height);
    return {
      width: Math.max(1, Math.round(doc.width * scale)),
      height: Math.max(1, Math.round(doc.height * scale)),
    };
  }, [stage.width, stage.height, doc.width, doc.height]);

  /* ------------------------------------------------------------------ */
  /* Paint                                                               */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cap the device ratio: a 3× retina preview of a square audiobook cover is
    // a lot of pixels to repaint on every slider drag.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(preview.width * dpr);
    canvas.height = Math.round(preview.height * dpr);
    canvas.style.width = `${preview.width}px`;
    canvas.style.height = `${preview.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    boxesRef.current = renderCover(
      ctx,
      doc,
      imageRef.current,
      preview.width,
      preview.height,
      { selectedId, guideX: guides.x, guideY: guides.y }
    );
  }, [doc, preview, selectedId, guides, tick]);

  /* ------------------------------------------------------------------ */
  /* Status auto-clear                                                   */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (status.state !== "ok" && status.state !== "error") return;
    const timer = setTimeout(() => setStatus({ state: "idle", message: "" }), 4200);
    return () => clearTimeout(timer);
  }, [status]);

  /* ------------------------------------------------------------------ */
  /* Image                                                               */
  /* ------------------------------------------------------------------ */

  const loadImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus({ state: "error", message: "That file is not an image." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus({
        state: "error",
        message: "Image is over 25 MB — try a smaller file.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result ?? "");
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setDoc((prev) => ({
          ...prev,
          image: {
            src,
            name: file.name,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          },
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
        }));
        setStatus({ state: "ok", message: "Image added." });
      };
      img.onerror = () =>
        setStatus({ state: "error", message: "That image could not be read." });
      img.src = src;
    };
    reader.onerror = () =>
      setStatus({ state: "error", message: "That image could not be read." });
    reader.readAsDataURL(file);
  }, []);

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImageFile(file);
    e.target.value = "";
  };

  const removeImage = () => {
    imageRef.current = null;
    patchDoc({ image: null, zoom: 1, offsetX: 0, offsetY: 0 });
  };

  /** Sets the trim to the photo's own pixel dimensions. */
  const matchCanvasToImage = () => {
    if (!doc.image) return;
    patchDoc({
      width: doc.image.naturalWidth,
      height: doc.image.naturalHeight,
      presetId: "custom",
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  };

  // Pasting a screenshot or a stock photo straight in is the fastest path.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        loadImageFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadImageFile]);

  /* ------------------------------------------------------------------ */
  /* Canvas interaction — select, drag, nudge                            */
  /* ------------------------------------------------------------------ */

  const pointFromEvent = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(e);
    // Topmost layer wins, matching what the eye expects to grab.
    const hit = [...doc.layers]
      .reverse()
      .find((layer) => {
        const box = boxesRef.current.get(layer.id);
        return layer.visible && box && hitTest(box, point.x, point.y);
      });

    if (!hit) {
      setSelectedId(null);
      return;
    }

    setSelectedId(hit.id);
    setTab("text");
    const box = boxesRef.current.get(hit.id);
    dragRef.current = {
      id: hit.id,
      pointerId: e.pointerId,
      startX: point.x,
      startY: point.y,
      layerX: hit.x,
      layerY: hit.y,
      halfHeightFraction: box ? box.h / 2 / preview.height : 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const point = pointFromEvent(e);
    let x = drag.layerX + (point.x - drag.startX) / preview.width;
    let y = drag.layerY + (point.y - drag.startY) / preview.height;

    // Snap to the optical centres — the two positions covers are built around.
    const snap = 0.012;
    const snapX = Math.abs(x - 0.5) < snap;
    if (snapX) x = 0.5;
    const centreY = y + drag.halfHeightFraction;
    const snapY = Math.abs(centreY - 0.5) < snap;
    if (snapY) y = 0.5 - drag.halfHeightFraction;

    setGuides({ x: snapX, y: snapY });
    patchLayer(drag.id, {
      x: clamp(x, -0.5, 1.5),
      y: clamp(y, -0.5, 1.5),
    });
  };

  const endDrag = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
    dragRef.current = null;
    setGuides({ x: false, y: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const step = e.shiftKey ? 0.01 : 0.002;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[e.key];
      if (!move) return;
      e.preventDefault();
      setDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l) =>
          l.id === selectedId ? { ...l, x: l.x + move[0], y: l.y + move[1] } : l
        ),
      }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  /* ------------------------------------------------------------------ */
  /* Layer operations                                                    */
  /* ------------------------------------------------------------------ */

  const addLayer = (role: LayerRole) => {
    const seed =
      role === "title"
        ? "Your Title"
        : role === "subtitle"
        ? "A subtitle goes here"
        : role === "author"
        ? "Author Name"
        : role === "series"
        ? "BOOK ONE"
        : "New text";

    // Borrow the current cover's treatment for that role so a new layer lands
    // already matching the design rather than as raw defaults.
    const sibling = doc.layers.find((l) => l.role === role);
    const layer = createLayer(
      role,
      seed,
      sibling
        ? {
            fontId: sibling.fontId,
            weight: sibling.weight,
            italic: sibling.italic,
            size: sibling.size,
            letterSpacing: sibling.letterSpacing,
            transform: sibling.transform,
            color: sibling.color,
            align: sibling.align,
            x: sibling.x,
            y: clamp(sibling.y + 0.08, 0, 0.95),
          }
        : undefined
    );
    setDoc((prev) => ({ ...prev, layers: [...prev.layers, layer] }));
    setSelectedId(layer.id);
    setTab("text");
  };

  const duplicateLayer = (id: string) => {
    const source = doc.layers.find((l) => l.id === id);
    if (!source) return;
    // Everything but the identity is copied; createLayer mints the new id.
    const { id: _ignored, ...style } = source;
    const copy = createLayer(source.role, source.text, {
      ...style,
      y: clamp(source.y + 0.05, 0, 0.98),
    });
    setDoc((prev) => {
      const index = prev.layers.findIndex((l) => l.id === id);
      const layers = [...prev.layers];
      layers.splice(index + 1, 0, copy);
      return { ...prev, layers };
    });
    setSelectedId(copy.id);
  };

  const deleteLayer = (id: string) => {
    setDoc((prev) => ({ ...prev, layers: prev.layers.filter((l) => l.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const moveLayer = (id: string, direction: -1 | 1) => {
    setDoc((prev) => {
      const index = prev.layers.findIndex((l) => l.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.layers.length) return prev;
      const layers = [...prev.layers];
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return { ...prev, layers };
    });
  };

  const applyStyle = (style: CoverStyle) => {
    setDoc((prev) => ({
      ...prev,
      ...(style.scrim ?? {}),
      layers: prev.layers.map((layer) => {
        const patch = styleForRole(style, layer.role);
        return patch ? { ...layer, ...patch } : layer;
      }),
    }));
    setStatus({ state: "ok", message: `${style.name} applied.` });
  };

  /** Wipes the saved draft and returns the workspace to the starting cover. */
  const resetDesign = () => {
    const confirmed = window.confirm(
      "Reset to the default cover? Your image, text and styling will be discarded."
    );
    if (!confirmed) return;

    imageRef.current = null;
    setDoc(createDefaultDoc());
    setSelectedId(null);
    setStatus({ state: "idle", message: "" });
    setDraftState("idle");
    // The autosave that follows this state change writes the defaults back.
    clearDraft();
  };

  /* ------------------------------------------------------------------ */
  /* Export                                                              */
  /* ------------------------------------------------------------------ */

  const exportImage = async () => {
    setStatus({ state: "busy", message: "Rendering…" });
    try {
      await ensureFontsLoaded(doc.layers);

      const canvas = document.createElement("canvas");
      canvas.width = doc.width;
      canvas.height = doc.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable in this browser.");

      renderCover(ctx, doc, imageRef.current, doc.width, doc.height);

      const mime = format === "png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, format === "jpeg" ? quality : undefined)
      );
      if (!blob) throw new Error("The export could not be encoded.");

      const title = doc.layers.find((l) => l.role === "title")?.text ?? "cover";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(title)}-${doc.width}x${doc.height}.${
        format === "png" ? "png" : "jpg"
      }`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the download a tick to start before the blob is revoked.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setStatus({
        state: "ok",
        message: `Exported ${doc.width} × ${doc.height} ${format === "png" ? "PNG" : "JPG"}.`,
      });
    } catch (error) {
      setStatus({
        state: "error",
        message:
          error instanceof Error ? error.message : "The export failed.",
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const imageTooSmall =
    doc.image !== null &&
    (doc.image.naturalWidth < doc.width * 0.85 ||
      doc.image.naturalHeight < doc.height * 0.85);

  const selectedFont = selected ? getFont(selected.fontId) : null;

  // Deliberately quiet: this should reassure, not compete with the export.
  const draftNote = {
    idle: "",
    restored: "Draft restored",
    saving: "Saving…",
    saved: "Saved to this browser",
    "saved-partial": "Saved — image not kept",
    error: "Could not save the draft",
  }[draftState];

  return (
    <div className="cover-designer">
      <header className="cd-header">
        <div className="cd-brand">
          <Palette size={18} className="cd-brand-icon" aria-hidden="true" />
          <h2 className="cd-title">Cover Designer</h2>
          <span className="cd-badge">PNG · JPG</span>
        </div>

        <div className="cd-actions">
          {status.state !== "idle" && (
            <span className={`cd-status ${status.state}`}>
              {status.state === "busy" && <span className="cd-dot" />}
              {status.message}
            </span>
          )}

          {status.state === "idle" && draftNote && (
            <span
              className={`cd-draft-note ${
                draftState === "error" || draftState === "saved-partial"
                  ? "warn"
                  : ""
              }`}
            >
              {draftNote}
            </span>
          )}

          <button
            type="button"
            className="cd-reset"
            onClick={resetDesign}
            title="Discard this cover and start from the default"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset to default
          </button>

          <div className="cd-format" role="group" aria-label="Export format">
            {(
              [
                ["png", "PNG"],
                ["jpeg", "JPG"],
              ] as [ExportFormat, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`cd-format-btn ${format === value ? "active" : ""}`}
                onClick={() => setFormat(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="cd-export"
            onClick={exportImage}
            disabled={status.state === "busy"}
          >
            <Download size={15} aria-hidden="true" />
            Export
          </button>
        </div>
      </header>

      <div className="cd-workspace">
        <aside className="cd-sidebar">
          <div className="cd-tabs" role="tablist">
            {(
              [
                ["canvas", "Image", ImageIcon],
                ["text", "Text", TypeIcon],
                ["styles", "Styles", Layers],
              ] as [Tab, string, typeof ImageIcon][]
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                className={`cd-tab ${tab === value ? "active" : ""}`}
                onClick={() => setTab(value)}
              >
                <Icon size={14} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="cd-scroll">
            {tab === "canvas" && (
              <CanvasPanel
                doc={doc}
                patchDoc={patchDoc}
                imageTooSmall={imageTooSmall}
                onPickFile={() => fileInputRef.current?.click()}
                onRemoveImage={removeImage}
                onMatchImage={matchCanvasToImage}
              />
            )}

            {tab === "text" && (
              <TextPanel
                doc={doc}
                selected={selected}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={addLayer}
                onDuplicate={duplicateLayer}
                onDelete={deleteLayer}
                onMove={moveLayer}
                patchLayer={patchLayer}
                patchSelected={patchSelected}
                selectedFont={selectedFont}
              />
            )}

            {tab === "styles" && (
              <StylesPanel onApply={applyStyle} />
            )}

            {format === "jpeg" && (
              <div className="cd-group">
                <span className="cd-group-label">JPG Quality</span>
                <Slider
                  label="Quality"
                  value={quality}
                  display={`${Math.round(quality * 100)}%`}
                  min={0.5}
                  max={1}
                  step={0.01}
                  onChange={setQuality}
                />
                <p className="cd-hint">
                  PNG is lossless and best for type over flat colour. JPG makes a
                  smaller file and is what most stores prefer for photographic
                  covers.
                </p>
              </div>
            )}
          </div>
        </aside>

        <div
          className={`cd-stage ${dragOver ? "drag-over" : ""}`}
          ref={stageRef}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) loadImageFile(file);
          }}
        >
          <canvas
            ref={canvasRef}
            className="cd-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />

          {!doc.image && (
            <button
              type="button"
              className="cd-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} aria-hidden="true" />
              <span className="cd-dropzone-title">Upload a cover image</span>
              <span className="cd-dropzone-hint">
                Click, drop a file here, or paste from the clipboard
              </span>
            </button>
          )}

          <p className="cd-stage-note">
            {doc.width} × {doc.height} px · drag the text to move it, arrow keys
            to nudge
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="cd-file-input"
        onChange={onFileInput}
      />
    </div>
  );
}

/* ==================================================================== */
/* Shared field components                                              */
/* ==================================================================== */

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="cd-field">
      <span className="cd-field-label">
        {label}
        <span className="cd-field-value">{display}</span>
      </span>
      <input
        type="range"
        className="cd-slider"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="cd-field">
      <span className="cd-field-label">{label}</span>
      <div className="cd-color-row">
        <input
          type="color"
          className="cd-color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="cd-input cd-hex"
          value={value.toUpperCase()}
          spellCheck={false}
          aria-label={`${label} hex value`}
          onChange={(e) => {
            const next = e.target.value.trim();
            onChange(next.startsWith("#") ? next : `#${next}`);
          }}
        />
      </div>
      <div className="cd-swatches">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={`cd-swatch ${
              swatch.toLowerCase() === value.toLowerCase() ? "active" : ""
            }`}
            style={{ background: swatch }}
            aria-label={`Use ${swatch}`}
            onClick={() => onChange(swatch)}
          />
        ))}
      </div>
    </div>
  );
}

function OptionRow<T extends string | number>({
  label,
  options,
  value,
  columns,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; title?: string }[];
  value: T;
  columns: number;
  onChange: (value: T) => void;
}) {
  return (
    <div className="cd-field">
      <span className="cd-field-label">{label}</span>
      <div className={`cd-options cols-${columns}`}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            title={option.title ?? option.label}
            className={`cd-option ${value === option.value ? "active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Image / canvas panel                                                 */
/* ==================================================================== */

function CanvasPanel({
  doc,
  patchDoc,
  imageTooSmall,
  onPickFile,
  onRemoveImage,
  onMatchImage,
}: {
  doc: CoverDoc;
  patchDoc: (patch: Partial<CoverDoc>) => void;
  imageTooSmall: boolean;
  onPickFile: () => void;
  onRemoveImage: () => void;
  onMatchImage: () => void;
}) {
  return (
    <>
      <div className="cd-group">
        <span className="cd-group-label">Cover Image</span>

        {doc.image ? (
          <>
            <div className="cd-image-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.image.src}
                alt=""
                className="cd-image-thumb"
              />
              <div className="cd-image-meta">
                <span className="cd-image-name">{doc.image.name}</span>
                <span className="cd-image-dims">
                  {doc.image.naturalWidth} × {doc.image.naturalHeight} px
                </span>
              </div>
            </div>

            {imageTooSmall && (
              <p className="cd-warning">
                This image is smaller than the cover and will be enlarged to
                fill it, which softens the detail. A file at least{" "}
                {doc.width} × {doc.height} px will stay sharp.
              </p>
            )}

            <div className="cd-button-row">
              <button type="button" className="cd-outline" onClick={onPickFile}>
                Replace
              </button>
              <button
                type="button"
                className="cd-outline danger"
                onClick={onRemoveImage}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="cd-outline block" onClick={onPickFile}>
              <Upload size={14} aria-hidden="true" />
              Upload an image
            </button>
            <p className="cd-hint">
              JPG, PNG or WebP. The file never leaves your browser.
            </p>
          </>
        )}
      </div>

      {doc.image && (
        <div className="cd-group">
          <div className="cd-group-head">
            <span className="cd-group-label">Framing</span>
            <button
              type="button"
              className="cd-link-btn"
              onClick={() => patchDoc({ zoom: 1, offsetX: 0, offsetY: 0 })}
            >
              Reset
            </button>
          </div>

          <OptionRow<ImageFit>
            label="Fit"
            columns={3}
            value={doc.fit}
            onChange={(fit) => patchDoc({ fit })}
            options={[
              { value: "cover", label: "Fill" },
              { value: "contain", label: "Fit" },
              { value: "stretch", label: "Stretch" },
            ]}
          />

          <Slider
            label="Zoom"
            value={doc.zoom}
            display={`${doc.zoom.toFixed(2)}×`}
            min={0.3}
            max={3}
            step={0.01}
            onChange={(zoom) => patchDoc({ zoom })}
          />
          <Slider
            label="Move X"
            value={doc.offsetX}
            display={`${Math.round(doc.offsetX * 100)}%`}
            min={-0.5}
            max={0.5}
            step={0.005}
            onChange={(offsetX) => patchDoc({ offsetX })}
          />
          <Slider
            label="Move Y"
            value={doc.offsetY}
            display={`${Math.round(doc.offsetY * 100)}%`}
            min={-0.5}
            max={0.5}
            step={0.005}
            onChange={(offsetY) => patchDoc({ offsetY })}
          />

          <Slider
            label="Brightness"
            value={doc.brightness}
            display={`${Math.round(doc.brightness * 100)}%`}
            min={0.3}
            max={1.7}
            step={0.01}
            onChange={(brightness) => patchDoc({ brightness })}
          />
          <Slider
            label="Contrast"
            value={doc.contrast}
            display={`${Math.round(doc.contrast * 100)}%`}
            min={0.4}
            max={1.8}
            step={0.01}
            onChange={(contrast) => patchDoc({ contrast })}
          />
          <Slider
            label="Saturation"
            value={doc.saturation}
            display={`${Math.round(doc.saturation * 100)}%`}
            min={0}
            max={2}
            step={0.01}
            onChange={(saturation) => patchDoc({ saturation })}
          />
          <Slider
            label="Blur"
            value={doc.blur}
            display={`${doc.blur.toFixed(1)}%`}
            min={0}
            max={6}
            step={0.1}
            onChange={(blur) => patchDoc({ blur })}
          />
        </div>
      )}

      <div className="cd-group">
        <span className="cd-group-label">Legibility Wash</span>
        <p className="cd-hint">
          A wash between the photo and the type is what keeps a title readable
          at thumbnail size.
        </p>

        <OptionRow<ScrimStyle>
          label="Style"
          columns={3}
          value={doc.scrim}
          onChange={(scrim) => patchDoc({ scrim })}
          options={[
            { value: "none", label: "None" },
            { value: "solid", label: "Even" },
            { value: "vignette", label: "Vignette" },
            { value: "top", label: "Top" },
            { value: "bottom", label: "Bottom" },
            { value: "both", label: "Both" },
          ]}
        />

        <Slider
          label="Strength"
          value={doc.scrimOpacity}
          display={`${Math.round(doc.scrimOpacity * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          onChange={(scrimOpacity) => patchDoc({ scrimOpacity })}
        />

        <ColorField
          label="Wash colour"
          value={doc.scrimColor}
          onChange={(scrimColor) => patchDoc({ scrimColor })}
        />
      </div>

      <div className="cd-group">
        <span className="cd-group-label">Cover Size</span>

        <div className="cd-preset-list">
          {CANVAS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`cd-preset ${doc.presetId === preset.id ? "active" : ""}`}
              onClick={() =>
                patchDoc({
                  presetId: preset.id,
                  width: preset.width,
                  height: preset.height,
                })
              }
            >
              <span className="cd-preset-name">{preset.label}</span>
              <span className="cd-preset-hint">{preset.hint}</span>
            </button>
          ))}
        </div>

        <div className="cd-dual">
          <label className="cd-mini-field">
            <span className="cd-field-label">Width</span>
            <input
              type="number"
              className="cd-input"
              min={200}
              max={6000}
              value={doc.width}
              onChange={(e) =>
                patchDoc({
                  width: clamp(Number(e.target.value) || 200, 200, 6000),
                  presetId: "custom",
                })
              }
            />
          </label>
          <label className="cd-mini-field">
            <span className="cd-field-label">Height</span>
            <input
              type="number"
              className="cd-input"
              min={200}
              max={6000}
              value={doc.height}
              onChange={(e) =>
                patchDoc({
                  height: clamp(Number(e.target.value) || 200, 200, 6000),
                  presetId: "custom",
                })
              }
            />
          </label>
        </div>

        {doc.image && (
          <button type="button" className="cd-outline block" onClick={onMatchImage}>
            <Crop size={14} aria-hidden="true" />
            Match the image size
          </button>
        )}

        <ColorField
          label="Background"
          value={doc.background}
          onChange={(background) => patchDoc({ background })}
        />
      </div>
    </>
  );
}

/* ==================================================================== */
/* Text panel                                                           */
/* ==================================================================== */

function TextPanel({
  doc,
  selected,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  patchLayer,
  patchSelected,
  selectedFont,
}: {
  doc: CoverDoc;
  selected: TextLayer | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (role: LayerRole) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  patchLayer: (id: string, patch: Partial<TextLayer>) => void;
  patchSelected: (patch: Partial<TextLayer>) => void;
  selectedFont: ReturnType<typeof getFont> | null;
}) {
  return (
    <>
      <div className="cd-group">
        <span className="cd-group-label">Text Layers</span>

        <ul className="cd-layers">
          {[...doc.layers].reverse().map((layer) => {
            const index = doc.layers.findIndex((l) => l.id === layer.id);
            return (
              <li
                key={layer.id}
                className={`cd-layer ${selectedId === layer.id ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="cd-layer-main"
                  onClick={() => onSelect(layer.id)}
                >
                  <span className="cd-layer-role">{ROLE_LABELS[layer.role]}</span>
                  <span className="cd-layer-text">
                    {layer.text.replace(/\n/g, " ") || "Empty"}
                  </span>
                </button>

                <div className="cd-layer-actions">
                  <button
                    type="button"
                    className="cd-icon"
                    aria-label={layer.visible ? "Hide layer" : "Show layer"}
                    onClick={() => patchLayer(layer.id, { visible: !layer.visible })}
                  >
                    {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    type="button"
                    className="cd-icon"
                    aria-label="Bring forward"
                    disabled={index === doc.layers.length - 1}
                    onClick={() => onMove(layer.id, 1)}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="cd-icon"
                    aria-label="Send backward"
                    disabled={index === 0}
                    onClick={() => onMove(layer.id, -1)}
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    className="cd-icon"
                    aria-label="Duplicate layer"
                    onClick={() => onDuplicate(layer.id)}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    className="cd-icon danger"
                    aria-label="Delete layer"
                    onClick={() => onDelete(layer.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="cd-options cols-4 cd-add-row">
          {(
            [
              ["title", "Title"],
              ["subtitle", "Subtitle"],
              ["author", "Author"],
              ["custom", "Text"],
            ] as [LayerRole, string][]
          ).map(([role, label]) => (
            <button
              key={role}
              type="button"
              className="cd-option"
              onClick={() => onAdd(role)}
            >
              <Plus size={12} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {!selected ? (
        <p className="cd-empty">
          Select a layer above, or click the text on the cover, to edit it.
        </p>
      ) : (
        <LayerInspector
          layer={selected}
          font={selectedFont ?? getFont(selected.fontId)}
          patch={patchSelected}
        />
      )}
    </>
  );
}

function LayerInspector({
  layer,
  font,
  patch,
}: {
  layer: TextLayer;
  font: ReturnType<typeof getFont>;
  patch: (patch: Partial<TextLayer>) => void;
}) {
  return (
    <>
      <div className="cd-group">
        <span className="cd-group-label">Content</span>
        <textarea
          className="cd-input cd-textarea"
          value={layer.text}
          rows={3}
          spellCheck={false}
          aria-label="Layer text"
          onChange={(e) => patch({ text: e.target.value })}
        />
        <p className="cd-hint">Press Enter for a deliberate line break.</p>
      </div>

      <div className="cd-group">
        <span className="cd-group-label">Typeface</span>

        <div className="cd-font-list">
          {FONT_CATEGORIES.map((category) => {
            const fonts = COVER_FONTS.filter((f) => f.category === category);
            if (!fonts.length) return null;
            return (
              <div key={category} className="cd-font-group">
                <span className="cd-font-category">{category}</span>
                {fonts.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`cd-font ${layer.fontId === option.id ? "active" : ""}`}
                    style={{ fontFamily: option.family }}
                    title={option.note}
                    onClick={() =>
                      patch({
                        fontId: option.id,
                        weight: nearestWeight(option.weights, layer.weight),
                        italic: layer.italic && option.italic,
                      })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <p className="cd-hint">{font.note}</p>

        <OptionRow<number>
          label="Weight"
          columns={Math.min(4, font.weights.length)}
          value={layer.weight}
          onChange={(weight) => patch({ weight })}
          options={font.weights.map((weight) => ({
            value: weight,
            label: String(weight),
          }))}
        />

        {font.italic && (
          <div className="cd-field">
            <button
              type="button"
              className={`cd-option block ${layer.italic ? "active" : ""}`}
              onClick={() => patch({ italic: !layer.italic })}
            >
              <span style={{ fontStyle: "italic" }}>Italic</span>
            </button>
          </div>
        )}

        <OptionRow<TextTransform>
          label="Letter case"
          columns={3}
          value={layer.transform}
          onChange={(transform) => patch({ transform })}
          options={[
            { value: "none", label: "Normal" },
            { value: "uppercase", label: "UPPER" },
            { value: "lowercase", label: "lower" },
          ]}
        />

        <Slider
          label="Size"
          value={layer.size}
          display={`${layer.size.toFixed(1)}%`}
          min={1}
          max={26}
          step={0.1}
          onChange={(size) => patch({ size })}
        />
        <Slider
          label="Tracking"
          value={layer.letterSpacing}
          display={`${layer.letterSpacing.toFixed(2)}em`}
          min={-0.06}
          max={0.6}
          step={0.005}
          onChange={(letterSpacing) => patch({ letterSpacing })}
        />
        <Slider
          label="Line height"
          value={layer.lineHeight}
          display={layer.lineHeight.toFixed(2)}
          min={0.8}
          max={2.2}
          step={0.01}
          onChange={(lineHeight) => patch({ lineHeight })}
        />
      </div>

      <div className="cd-group">
        <span className="cd-group-label">Colour</span>
        <ColorField
          label="Text colour"
          value={layer.color}
          onChange={(color) => patch({ color })}
        />
        <Slider
          label="Opacity"
          value={layer.opacity}
          display={`${Math.round(layer.opacity * 100)}%`}
          min={0.05}
          max={1}
          step={0.01}
          onChange={(opacity) => patch({ opacity })}
        />
      </div>

      <div className="cd-group">
        <span className="cd-group-label">Placement</span>

        <div className="cd-field">
          <span className="cd-field-label">Alignment</span>
          <div className="cd-options cols-3">
            {(
              [
                ["left", AlignLeft, "Left"],
                ["center", AlignCenter, "Centre"],
                ["right", AlignRight, "Right"],
              ] as [TextAlign, typeof AlignLeft, string][]
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                title={label}
                className={`cd-option ${layer.align === value ? "active" : ""}`}
                onClick={() =>
                  // Keep the block where it is on screen when the anchor moves.
                  patch({
                    align: value,
                    x: value === "left" ? 0.12 : value === "right" ? 0.88 : 0.5,
                  })
                }
              >
                <Icon size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <OptionRow<number>
          label="Jump to"
          columns={3}
          value={layer.y}
          onChange={(value) => patch({ y: value })}
          options={[
            { value: 0.08, label: "Top" },
            { value: 0.42, label: "Middle" },
            { value: 0.82, label: "Bottom" },
          ]}
        />

        <Slider
          label="Position X"
          value={layer.x}
          display={`${Math.round(layer.x * 100)}%`}
          min={-0.1}
          max={1.1}
          step={0.002}
          onChange={(x) => patch({ x })}
        />
        <Slider
          label="Position Y"
          value={layer.y}
          display={`${Math.round(layer.y * 100)}%`}
          min={-0.1}
          max={1.1}
          step={0.002}
          onChange={(y) => patch({ y })}
        />
        <Slider
          label="Text box width"
          value={layer.width}
          display={`${Math.round(layer.width * 100)}%`}
          min={0.15}
          max={1}
          step={0.01}
          onChange={(width) => patch({ width })}
        />
        <Slider
          label="Rotation"
          value={layer.rotation}
          display={`${layer.rotation.toFixed(0)}°`}
          min={-90}
          max={90}
          step={0.5}
          onChange={(rotation) => patch({ rotation })}
        />
      </div>

      <div className="cd-group">
        <div className="cd-group-head">
          <span className="cd-group-label">Effects</span>
          <button
            type="button"
            className="cd-link-btn"
            onClick={() =>
              patch({
                shadowEnabled: false,
                bandEnabled: false,
                strokeWidth: 0,
                rules: "none",
                rotation: 0,
              })
            }
          >
            <RotateCcw size={11} aria-hidden="true" /> Clear
          </button>
        </div>

        <button
          type="button"
          className={`cd-option block ${layer.shadowEnabled ? "active" : ""}`}
          onClick={() => patch({ shadowEnabled: !layer.shadowEnabled })}
        >
          Drop shadow
        </button>

        {layer.shadowEnabled && (
          <div className="cd-nested">
            <Slider
              label="Blur"
              value={layer.shadowBlur}
              display={`${layer.shadowBlur.toFixed(0)}%`}
              min={0}
              max={80}
              step={1}
              onChange={(shadowBlur) => patch({ shadowBlur })}
            />
            <Slider
              label="Offset X"
              value={layer.shadowOffsetX}
              display={`${layer.shadowOffsetX.toFixed(0)}%`}
              min={-30}
              max={30}
              step={1}
              onChange={(shadowOffsetX) => patch({ shadowOffsetX })}
            />
            <Slider
              label="Offset Y"
              value={layer.shadowOffsetY}
              display={`${layer.shadowOffsetY.toFixed(0)}%`}
              min={-30}
              max={30}
              step={1}
              onChange={(shadowOffsetY) => patch({ shadowOffsetY })}
            />
            <Slider
              label="Shadow opacity"
              value={layer.shadowOpacity}
              display={`${Math.round(layer.shadowOpacity * 100)}%`}
              min={0}
              max={1}
              step={0.01}
              onChange={(shadowOpacity) => patch({ shadowOpacity })}
            />
            <ColorField
              label="Shadow colour"
              value={layer.shadowColor}
              onChange={(shadowColor) => patch({ shadowColor })}
            />
          </div>
        )}

        <Slider
          label="Outline"
          value={layer.strokeWidth}
          display={`${layer.strokeWidth.toFixed(1)}%`}
          min={0}
          max={10}
          step={0.1}
          onChange={(strokeWidth) => patch({ strokeWidth })}
        />
        {layer.strokeWidth > 0 && (
          <div className="cd-nested">
            <ColorField
              label="Outline colour"
              value={layer.strokeColor}
              onChange={(strokeColor) => patch({ strokeColor })}
            />
          </div>
        )}

        <button
          type="button"
          className={`cd-option block ${layer.bandEnabled ? "active" : ""}`}
          onClick={() => patch({ bandEnabled: !layer.bandEnabled })}
        >
          Background band
        </button>

        {layer.bandEnabled && (
          <div className="cd-nested">
            <ColorField
              label="Band colour"
              value={layer.bandColor}
              onChange={(bandColor) => patch({ bandColor })}
            />
            <Slider
              label="Band opacity"
              value={layer.bandOpacity}
              display={`${Math.round(layer.bandOpacity * 100)}%`}
              min={0}
              max={1}
              step={0.01}
              onChange={(bandOpacity) => patch({ bandOpacity })}
            />
            <Slider
              label="Padding X"
              value={layer.bandPadX}
              display={`${layer.bandPadX.toFixed(0)}%`}
              min={0}
              max={140}
              step={1}
              onChange={(bandPadX) => patch({ bandPadX })}
            />
            <Slider
              label="Padding Y"
              value={layer.bandPadY}
              display={`${layer.bandPadY.toFixed(0)}%`}
              min={0}
              max={140}
              step={1}
              onChange={(bandPadY) => patch({ bandPadY })}
            />
          </div>
        )}

        <OptionRow<TextLayer["rules"]>
          label="Hairline rules"
          columns={4}
          value={layer.rules}
          onChange={(rules) => patch({ rules })}
          options={[
            { value: "none", label: "Off" },
            { value: "above", label: "Above" },
            { value: "below", label: "Below" },
            { value: "both", label: "Both" },
          ]}
        />

        {layer.rules !== "none" && (
          <div className="cd-nested">
            <Slider
              label="Rule length"
              value={layer.ruleLength}
              display={`${Math.round(layer.ruleLength * 100)}%`}
              min={0.05}
              max={1}
              step={0.01}
              onChange={(ruleLength) => patch({ ruleLength })}
            />
            <Slider
              label="Thickness"
              value={layer.ruleThickness}
              display={`${layer.ruleThickness.toFixed(1)}%`}
              min={0.5}
              max={16}
              step={0.5}
              onChange={(ruleThickness) => patch({ ruleThickness })}
            />
            <Slider
              label="Gap"
              value={layer.ruleGap}
              display={`${layer.ruleGap.toFixed(0)}%`}
              min={0}
              max={140}
              step={1}
              onChange={(ruleGap) => patch({ ruleGap })}
            />
          </div>
        )}
      </div>
    </>
  );
}

/* ==================================================================== */
/* Styles panel                                                         */
/* ==================================================================== */

function StylesPanel({ onApply }: { onApply: (style: CoverStyle) => void }) {
  return (
    <div className="cd-group">
      <span className="cd-group-label">Cover Styles</span>
      <p className="cd-hint">
        Each style sets the whole type system at once — face, weight, tracking,
        case, colour and vertical rhythm for the title, subtitle, series line
        and byline. Your image and horizontal composition are left alone.
      </p>

      <div className="cd-styles">
        {COVER_STYLES.map((style) => {
          const titleFont = style.roles.title?.fontId;
          return (
            <button
              key={style.id}
              type="button"
              className="cd-style"
              onClick={() => onApply(style)}
            >
              <span
                className="cd-style-name"
                style={
                  titleFont ? { fontFamily: getFont(titleFont).family } : undefined
                }
              >
                {style.name}
              </span>
              <span className="cd-style-genre">{style.genre}</span>
              <span className="cd-style-desc">{style.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
