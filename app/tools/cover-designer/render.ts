/**
 * The cover renderer.
 *
 * One function paints both the on-screen preview and the exported file, so what
 * the designer sees is what downloads — the preview is simply the same document
 * drawn into a smaller canvas. Everything in the document is expressed as a
 * fraction of the canvas, so the only difference between the two is `W`/`H`.
 */
import { getFont } from "./fonts";
import type { CoverDoc, TextLayer } from "./types";

/** Where a layer landed, in target-canvas pixels. Used for hit testing. */
export type LayerBox = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  rotation: number;
};

export type RenderOptions = {
  /** Highlighted with a selection frame. Preview only. */
  selectedId?: string | null;
  /** Centre guides, shown while a drag is snapped. */
  guideX?: boolean;
  guideY?: boolean;
};

/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/* ------------------------------------------------------------------ */

/** #RGB / #RRGGBB → rgba() at the given alpha. Non-hex values pass through. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  let r = 0;
  let g = 0;
  let b = 0;
  if (short) {
    r = parseInt(short[1] + short[1], 16);
    g = parseInt(short[2] + short[2], 16);
    b = parseInt(short[3] + short[3], 16);
  } else if (long) {
    r = parseInt(long[1], 16);
    g = parseInt(long[2], 16);
    b = parseInt(long[3], 16);
  } else {
    return value;
  }
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/* ------------------------------------------------------------------ */
/* Type measurement                                                    */
/* ------------------------------------------------------------------ */

/** A `ctx.font` / CSS `font` shorthand for a layer at a given pixel size. */
export function fontShorthand(layer: TextLayer, sizePx: number): string {
  const font = getFont(layer.fontId);
  const italic = layer.italic && font.italic ? "italic " : "";
  return `${italic}${layer.weight} ${sizePx}px ${font.family}`;
}

export function transformText(layer: TextLayer): string {
  if (layer.transform === "uppercase") return layer.text.toUpperCase();
  if (layer.transform === "lowercase") return layer.text.toLowerCase();
  return layer.text;
}

/**
 * Waits for every face in use. Canvas has no equivalent of the CSS font-loading
 * fallback: drawing before the file arrives silently renders in a system font,
 * which is exactly the kind of error you only notice after uploading to KDP.
 */
export async function ensureFontsLoaded(layers: TextLayer[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(
    layers.map((layer) =>
      document.fonts
        .load(fontShorthand(layer, 64), transformText(layer) || "Ag")
        .catch(() => undefined)
    )
  );
}

/**
 * Line width with tracking applied. Measured the same way it is drawn — per
 * character once tracking is non-zero — so centring never drifts.
 */
function lineWidth(
  ctx: CanvasRenderingContext2D,
  line: string,
  tracking: number
): number {
  if (!tracking) return ctx.measureText(line).width;
  const chars = Array.from(line);
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width;
  return total + tracking * Math.max(0, chars.length - 1);
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  tracking: number,
  mode: "fill" | "stroke"
): void {
  // Without tracking the whole string is drawn at once, which keeps the
  // font's kerning and ligatures intact.
  if (!tracking) {
    if (mode === "fill") ctx.fillText(line, x, y);
    else ctx.strokeText(line, x, y);
    return;
  }
  let cursor = x;
  for (const ch of Array.from(line)) {
    if (mode === "fill") ctx.fillText(ch, cursor, y);
    else ctx.strokeText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + tracking;
  }
}

/** Honours explicit newlines, then greedy-wraps to the box. */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  tracking: number
): string[] {
  const out: string[] = [];

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && lineWidth(ctx, candidate, tracking) > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }

      // A single unbreakable word wider than the box would otherwise run off
      // the cover; break it by character instead.
      while (lineWidth(ctx, line, tracking) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && lineWidth(ctx, line.slice(0, cut), tracking) > maxWidth) {
          cut -= 1;
        }
        out.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    out.push(line);
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Image placement                                                     */
/* ------------------------------------------------------------------ */

export function imageRect(
  doc: CoverDoc,
  img: { width: number; height: number },
  W: number,
  H: number
): { x: number; y: number; w: number; h: number } {
  let w: number;
  let h: number;

  if (doc.fit === "stretch") {
    w = W * doc.zoom;
    h = H * doc.zoom;
  } else {
    const ratioW = W / img.width;
    const ratioH = H / img.height;
    const scale =
      (doc.fit === "cover" ? Math.max(ratioW, ratioH) : Math.min(ratioW, ratioH)) *
      doc.zoom;
    w = img.width * scale;
    h = img.height * scale;
  }

  return {
    x: (W - w) / 2 + doc.offsetX * W,
    y: (H - h) / 2 + doc.offsetY * H,
    w,
    h,
  };
}

/* ------------------------------------------------------------------ */
/* Main render                                                         */
/* ------------------------------------------------------------------ */

export function renderCover(
  ctx: CanvasRenderingContext2D,
  doc: CoverDoc,
  image: CanvasImageSource | null,
  W: number,
  H: number,
  options: RenderOptions = {}
): Map<string, LayerBox> {
  const boxes = new Map<string, LayerBox>();

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  /* ---------- background + photograph ---------- */

  ctx.fillStyle = doc.background;
  ctx.fillRect(0, 0, W, H);

  if (image) {
    const source = image as CanvasImageSource & {
      width: number;
      height: number;
    };
    const rect = imageRect(doc, source, W, H);
    const filters: string[] = [];
    if (doc.brightness !== 1) filters.push(`brightness(${doc.brightness})`);
    if (doc.contrast !== 1) filters.push(`contrast(${doc.contrast})`);
    if (doc.saturation !== 1) filters.push(`saturate(${doc.saturation})`);
    // Blur is stored as a percentage of the canvas width so it survives a
    // change of trim size.
    if (doc.blur > 0) filters.push(`blur(${(doc.blur / 100) * W}px)`);

    ctx.save();
    // Clip so a blurred or zoomed photo cannot bleed past the trim.
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    if (filters.length) ctx.filter = filters.join(" ");
    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  /* ---------- legibility scrim ---------- */

  drawScrim(ctx, doc, W, H);

  /* ---------- text layers ---------- */

  for (const layer of doc.layers) {
    if (!layer.visible) continue;
    const box = drawTextLayer(ctx, layer, W, H);
    if (box) boxes.set(layer.id, box);
  }

  /* ---------- preview-only chrome ---------- */

  if (options.selectedId) {
    const box = boxes.get(options.selectedId);
    if (box) drawSelection(ctx, box);
  }

  if (options.guideX || options.guideY) {
    ctx.save();
    ctx.strokeStyle = "rgba(56, 178, 166, 0.9)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    if (options.guideX) {
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
    }
    if (options.guideY) {
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
  return boxes;
}

function drawScrim(
  ctx: CanvasRenderingContext2D,
  doc: CoverDoc,
  W: number,
  H: number
): void {
  const { scrim, scrimColor: color, scrimOpacity: alpha } = doc;
  if (scrim === "none" || alpha <= 0) return;

  ctx.save();

  if (scrim === "solid") {
    ctx.fillStyle = withAlpha(color, alpha);
    ctx.fillRect(0, 0, W, H);
  }

  if (scrim === "bottom" || scrim === "both") {
    const g = ctx.createLinearGradient(0, H, 0, H * 0.3);
    g.addColorStop(0, withAlpha(color, alpha));
    g.addColorStop(0.55, withAlpha(color, alpha * 0.35));
    g.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.3, W, H * 0.7);
  }

  if (scrim === "top" || scrim === "both") {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    g.addColorStop(0, withAlpha(color, alpha));
    g.addColorStop(0.55, withAlpha(color, alpha * 0.35));
    g.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.7);
  }

  if (scrim === "vignette") {
    const g = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.25,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.75
    );
    g.addColorStop(0, withAlpha(color, 0));
    g.addColorStop(1, withAlpha(color, alpha));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  W: number,
  H: number
): LayerBox | null {
  const text = transformText(layer);
  const fontPx = (layer.size / 100) * W;
  if (fontPx <= 0) return null;

  ctx.save();
  ctx.font = fontShorthand(layer, fontPx);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const tracking = layer.letterSpacing * fontPx;
  const boxWidth = Math.max(1, layer.width * W);
  const lines = wrapLines(ctx, text, boxWidth, tracking);
  const widths = lines.map((line) => lineWidth(ctx, line, tracking));
  const blockWidth = Math.max(1, ...widths);

  // Font metrics rather than a fixed ratio: a script face and a condensed
  // gothic sit very differently inside the same line box.
  const metrics = ctx.measureText("Hg");
  const ascent = metrics.fontBoundingBoxAscent || fontPx * 0.8;
  const descent = metrics.fontBoundingBoxDescent || fontPx * 0.2;
  const lineBox = fontPx * layer.lineHeight;
  const halfLead = (lineBox - (ascent + descent)) / 2;
  const blockHeight = lineBox * lines.length;

  // `x` is the anchor the alignment hangs from; `y` is the block's top edge.
  const anchorX = layer.x * W;
  const left =
    layer.align === "left"
      ? anchorX
      : layer.align === "center"
      ? anchorX - blockWidth / 2
      : anchorX - blockWidth;
  const top = layer.y * H;
  const cx = left + blockWidth / 2;
  const cy = top + blockHeight / 2;

  ctx.translate(cx, cy);
  if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.globalAlpha = clamp(layer.opacity, 0, 1);

  const padX = (layer.bandPadX / 100) * fontPx;
  const padY = (layer.bandPadY / 100) * fontPx;

  if (layer.bandEnabled) {
    ctx.save();
    ctx.globalAlpha = clamp(layer.opacity * layer.bandOpacity, 0, 1);
    ctx.fillStyle = layer.bandColor;
    ctx.fillRect(
      -blockWidth / 2 - padX,
      -blockHeight / 2 - padY,
      blockWidth + padX * 2,
      blockHeight + padY * 2
    );
    ctx.restore();
  }

  /* ---------- rules ---------- */

  const ruleGap = (layer.ruleGap / 100) * fontPx;
  const ruleThickness = Math.max(0.5, (layer.ruleThickness / 100) * fontPx);
  const ruleWidth = layer.ruleLength * W;

  if (layer.rules !== "none") {
    ctx.save();
    ctx.fillStyle = layer.color;
    const bandPadY = layer.bandEnabled ? padY : 0;
    if (layer.rules === "above" || layer.rules === "both") {
      ctx.fillRect(
        -ruleWidth / 2,
        -blockHeight / 2 - bandPadY - ruleGap - ruleThickness,
        ruleWidth,
        ruleThickness
      );
    }
    if (layer.rules === "below" || layer.rules === "both") {
      ctx.fillRect(
        -ruleWidth / 2,
        blockHeight / 2 + bandPadY + ruleGap,
        ruleWidth,
        ruleThickness
      );
    }
    ctx.restore();
  }

  /* ---------- the type itself ---------- */

  const strokePx = (layer.strokeWidth / 100) * fontPx;

  const applyShadow = () => {
    if (!layer.shadowEnabled) return;
    ctx.shadowColor = withAlpha(layer.shadowColor, layer.shadowOpacity);
    ctx.shadowBlur = (layer.shadowBlur / 100) * fontPx;
    ctx.shadowOffsetX = (layer.shadowOffsetX / 100) * fontPx;
    ctx.shadowOffsetY = (layer.shadowOffsetY / 100) * fontPx;
  };

  lines.forEach((line, i) => {
    const lineW = widths[i];
    const x =
      layer.align === "left"
        ? -blockWidth / 2
        : layer.align === "center"
        ? -lineW / 2
        : blockWidth / 2 - lineW;
    const y = -blockHeight / 2 + halfLead + ascent + i * lineBox;

    // The outline carries the shadow, then the shadow is switched off for the
    // fill — otherwise the two passes stack into a muddy double shadow.
    applyShadow();
    if (strokePx > 0) {
      ctx.lineWidth = strokePx * 2; // strokeText centres on the glyph edge
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      drawLine(ctx, line, x, y, tracking, "stroke");
      ctx.shadowColor = "transparent";
    }

    ctx.fillStyle = layer.color;
    drawLine(ctx, line, x, y, tracking, "fill");
    ctx.shadowColor = "transparent";
  });

  ctx.restore();

  // Hit box covers the band and any rules, which is what a user grabs.
  const extraX = layer.bandEnabled ? padX : 0;
  const extraY =
    (layer.bandEnabled ? padY : 0) +
    (layer.rules === "none" ? 0 : ruleGap + ruleThickness);

  return {
    cx,
    cy,
    w: blockWidth + extraX * 2,
    h: blockHeight + extraY * 2,
    rotation: layer.rotation,
  };
}

function drawSelection(ctx: CanvasRenderingContext2D, box: LayerBox): void {
  ctx.save();
  ctx.translate(box.cx, box.cy);
  if (box.rotation) ctx.rotate((box.rotation * Math.PI) / 180);
  ctx.strokeStyle = "rgba(56, 178, 166, 0.95)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(-box.w / 2 - 6, -box.h / 2 - 6, box.w + 12, box.h + 12);
  ctx.restore();
}

/** Point-in-layer test that accounts for the layer's rotation. */
export function hitTest(box: LayerBox, px: number, py: number): boolean {
  const dx = px - box.cx;
  const dy = py - box.cy;
  const angle = (-box.rotation * Math.PI) / 180;
  const lx = dx * Math.cos(angle) - dy * Math.sin(angle);
  const ly = dx * Math.sin(angle) + dy * Math.cos(angle);
  return Math.abs(lx) <= box.w / 2 + 8 && Math.abs(ly) <= box.h / 2 + 8;
}
