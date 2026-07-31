import JSZip from 'jszip';

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Escape a string for safe use in XML text nodes and attribute values
function escapeXml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Read the media type declared in a data URI header (e.g. "image/png")
function getDataUriMime(dataUri) {
  const m = /^data:([^;,]+)/.exec(dataUri || '');
  return m ? m[1].toLowerCase() : '';
}

// Map an image media type to a file extension
function extForMime(mimeType) {
  switch (mimeType) {
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    case 'image/svg+xml': return 'svg';
    default: return 'jpg';
  }
}

// Resolve the true media type + extension of a stored image from its data URI,
// falling back to the recorded mimeType. The data URI is authoritative because
// placeholder images may declare a mimeType that doesn't match their bytes.
function resolveImageType(imgData) {
  const mimeType = getDataUriMime(imgData.base64) || imgData.mimeType || 'image/jpeg';
  return { mimeType, ext: extForMime(mimeType) };
}

// Convert a data URI to a Uint8Array, supporting both base64-encoded payloads
// and plain/URL-encoded text payloads (e.g. inline "data:image/svg+xml;utf8,<svg…>").
function dataUriToUint8Array(dataUri) {
  const commaIdx = dataUri.indexOf(',');
  const header = commaIdx === -1 ? '' : dataUri.slice(0, commaIdx);
  const payload = commaIdx === -1 ? dataUri : dataUri.slice(commaIdx + 1);

  if (/;base64/i.test(header)) {
    const binaryString = window.atob(payload);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Non-base64: the payload is text, often percent-encoded. Decode each run of
  // valid %XX escapes (handling multi-byte UTF-8) while leaving stray '%' chars
  // untouched — some inline SVGs mix real escapes (%23) with literal '%' (100%).
  const text = payload.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    try {
      return decodeURIComponent(run);
    } catch (e) {
      return run;
    }
  });
  return new TextEncoder().encode(text);
}

// Basic markdown-like parser to XHTML body content
export function parseContentToHTML(text, inlineImages, isPreview = false) {
  if (!text) return '<p></p>';

  // Escape HTML entities to avoid breaking XHTML validation
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Split into paragraphs by blank lines
  const sections = html.split(/\n\s*\n/);
  const parsedSections = sections.map((sec, idx) => {
    let s = sec.trim();
    if (!s) return '';

    // Handle Page Breaks: [pagebreak] or custom marker
    if (s === '---' || s.toLowerCase() === '[pagebreak]' || s.toLowerCase() === '***') {
      return isPreview
        ? '<div class="page-break-indicator"><span>PAGE BREAK</span></div>'
        : '<div class="page-break"></div>';
    }

    // Handle scene break ornament: [scenebreak] (centered, no page break)
    if (s.toLowerCase() === '[scenebreak]') {
      return isPreview
        ? '<div class="scene-break">* * *</div>'
        : '<p class="scene-break">* * *</p>';
    }

    // Handle inline image tags: ![caption](img:imageId)
    const imgRegex = /!\[(.*?)\]\(img:(.*?)\)/g;
    if (imgRegex.test(s)) {
      return s.replace(imgRegex, (match, caption, imageId) => {
        const imgData = inlineImages[imageId];
        if (!imgData) return `<p class="error">[Image ${imageId} missing]</p>`;

        const { ext } = resolveImageType(imgData);
        const srcPath = isPreview ? imgData.base64 : `../images/${imageId}.${ext}`;
        const imgClass = isPreview ? 'preview-img' : 'inline-image';

        // caption has already had &<> escaped by the top-level pass; escape
        // the remaining quote chars so it is safe inside the alt attribute
        const altText = (caption || 'Image').replace(/"/g, '&quot;');

        return `<div class="inline-image-container">` +
               `<img class="${imgClass}" src="${srcPath}" alt="${altText}" />` +
               (caption ? `<div class="image-caption">${caption}</div>` : '') +
               `</div>`;
      });
    }

    // Handle custom centered lines: [center]Text[/center]
    const centerRegex = /\[center\]([\s\S]*?)\[\/center\]/gi;
    if (centerRegex.test(s)) {
      s = s.replace(centerRegex, (m, content) => content);
      // Clean up markdown formatting inside center block
      s = applyMarkdownInline(s);
      return `<p class="no-indent" style="text-align: center;">${s}</p>`;
    }

    // Handle blockquotes: lines beginning with "> " (the '>' is escaped to
    // '&gt;' by the top-level pass, so match that form)
    if (s.startsWith('&gt;')) {
      const inner = s
        .split('\n')
        .map(line => line.replace(/^\s*&gt;\s?/, ''))
        .join('<br />');
      return `<blockquote>${applyMarkdownInline(inner)}</blockquote>`;
    }

    // Check if it's a heading inside the page
    if (s.startsWith('# ')) {
      return `<h2>${applyMarkdownInline(s.slice(2))}</h2>`;
    }
    if (s.startsWith('## ')) {
      return `<h3>${applyMarkdownInline(s.slice(3))}</h3>`;
    }

    // Regular paragraph
    s = applyMarkdownInline(s);
    return `<p>${s}</p>`;
  });

  return parsedSections.filter(s => s !== '').join('\n');
}

function applyMarkdownInline(text) {
  // bold: **bold** or __bold__
  let t = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // strikethrough: ~~text~~ (before italic so single ~ isn't mistaken)
  t = t.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // italic: *italic* or _italic_
  t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
  t = t.replace(/_(.*?)_/g, '<em>$1</em>');

  // Clean trailing carriage returns if any
  t = t.replace(/\r/g, '');
  return t;
}

// Main compiler function
export async function generateEPUB(metadata, chapters, inlineImages) {
  const zip = new JSZip();

  // 1. mimetype: MUST be first, uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. OEBPS/styles.css
  const alignmentVal = metadata.alignment || 'justify';
  const fontStyleVal = metadata.fontStyle === 'serif' ? '"Lora", "Georgia", serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const sizeMultiplier = { sm: '0.9em', md: '1.0em', lg: '1.15em', xl: '1.3em' }[metadata.baseFontSize || 'md'];

  // Chapter-title styling from the "Chapter Titles" panel. Emitted as an
  // override block appended after the base rules rather than edited into them,
  // so the validated defaults stay exactly as they were. Every value falls back
  // to the original hard-coded one when the setting is absent.
  const ts = metadata.titleStyle || {};
  const titleSize = { sm: '1.4em', md: '1.8em', lg: '2.2em', xl: '2.8em' }[ts.size || 'md'];
  const titleTracking = { normal: '0', wide: '0.06em', wider: '0.12em' }[ts.tracking || 'normal'];
  const titleFont = ts.font === 'sans'
    ? '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    : '"Georgia", serif';
  const titleCase = ts.transform === 'uppercase'
    ? 'text-transform: uppercase;'
    : ts.transform === 'smallcaps'
      ? 'font-variant: small-caps;'
      : 'text-transform: none;';

  const titleCss = `
/* ---- Chapter title: overrides the h1 defaults above ---- */
h1 {
  margin-top: ${Number(ts.spaceAbove ?? 1.8)}em;
  margin-bottom: ${Number(ts.spaceBelow ?? 1.2)}em;
  text-align: ${ts.align || 'center'};
  font-family: ${titleFont};
  font-size: ${titleSize};
  font-weight: ${ts.weight === 'normal' ? 'normal' : 'bold'};
  letter-spacing: ${titleTracking};
  ${titleCase}
}
${ts.rule ? `
/* Hairline rule beneath the chapter title */
h1 {
  border-bottom: 1px solid #999999;
  padding-bottom: 0.4em;
}
` : ''}`;

  const stylesCss = `/* KDP-Optimized Ebook Stylesheet */
body {
  font-family: ${fontStyleVal};
  font-size: ${sizeMultiplier};
  line-height: 1.6;
  margin: 4% 6%;
  padding: 0;
  text-align: ${alignmentVal};
  color: #000000;
  background-color: #FFFFFF;
}

h1 {
  text-align: center;
  font-family: "Georgia", serif;
  font-size: 1.8em;
  font-weight: bold;
  margin-top: 1.8em;
  margin-bottom: 1.2em;
  /* No forced page break here: each chapter is its own spine document and
     already starts on a fresh page. Forcing a break before the first h1
     produced an empty leading page. */
}

h2, h3 {
  font-family: "Georgia", serif;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  text-align: center;
}

p {
  margin-top: 0;
  margin-bottom: 1.1em;
  text-indent: 1.5em;
}

/* First paragraph and paragraphs following dividers do not have indents */
p:first-of-type,
.page-break + p,
.inline-image-container + p,
h1 + p, h2 + p, h3 + p {
  text-indent: 0;
}

p.no-indent {
  text-indent: 0;
}

/* Drop Caps styling */
.drop-cap::first-letter {
  font-size: 3.2em;
  font-weight: bold;
  float: left;
  line-height: 0.85;
  margin: 0.1em 0.08em 0 0;
  font-family: "Georgia", serif;
}

/* Inline images layout */
.inline-image-container {
  text-align: center;
  margin: 1.8em 0;
  text-indent: 0;
  page-break-inside: avoid;
}

.inline-image {
  max-width: 100%;
  height: auto;
  border-radius: 2px;
}

.image-caption {
  font-size: 0.85em;
  color: #555555;
  margin-top: 0.5em;
  font-style: italic;
}

/* Section Page Break */
.page-break {
  page-break-before: always;
  break-before: page;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
}

/* Block quotation (epigraphs, letters) */
blockquote {
  margin: 1.2em 1.8em;
  padding-left: 0.9em;
  border-left: 3px solid #cccccc;
  font-style: italic;
  color: #333333;
  text-indent: 0;
}

/* Scene break ornament (no page break) */
.scene-break {
  text-align: center;
  margin: 1.6em 0;
  letter-spacing: 0.5em;
  text-indent: 0;
  page-break-inside: avoid;
}

/* Cover page: full-bleed, no reader margins */
body.cover-page {
  margin: 0;
  padding: 0;
  text-align: center;
}

.cover-wrapper {
  margin: 0;
  padding: 0;
  height: 100%;
  text-align: center;
  page-break-after: always;
}

.cover-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}
${titleCss}`;
  zip.file('OEBPS/styles.css', stylesCss);

  // 4. Create Chapters XHTML and gather referenced images
  const oebps = zip.folder('OEBPS');
  const chaptersFolder = oebps.folder('chapters');
  const imagesFolder = oebps.folder('images');

  const referencedImageIds = new Set();

  chapters.forEach((ch, index) => {
    const chNum = index + 1;
    const bodyHTML = parseContentToHTML(ch.content, inlineImages);

    // Find referenced images in this chapter
    const imgRegex = /!\[.*?\]\(img:(.*?)\)/g;
    let match;
    while ((match = imgRegex.exec(ch.content)) !== null) {
      if (inlineImages[match[1]]) {
        referencedImageIds.add(match[1]);
      }
    }

    const dropCapClass = ch.dropCap ? 'has-drop-cap' : '';

    // Process Drop cap implementation directly on first paragraph
    let finalBodyHTML = bodyHTML;
    if (ch.dropCap) {
      // Find the first paragraph tag <p> and insert the class
      const firstPTagIdx = bodyHTML.indexOf('<p>');
      if (firstPTagIdx !== -1) {
        finalBodyHTML = bodyHTML.substring(0, firstPTagIdx) +
                       '<p class="drop-cap">' +
                       bodyHTML.substring(firstPTagIdx + 3);
      }
    }

    const chapterXml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(metadata.language || 'en')}">
<head>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles.css" />
</head>
<body class="${dropCapClass}">
  <h1>${escapeXml(ch.title)}</h1>
  ${finalBodyHTML}
</body>
</html>`;

    chaptersFolder.file(`chapter_${chNum}.xhtml`, chapterXml);
  });

  // 5. Write Referenced Image Binaries into images folder
  const manifestImages = [];
  referencedImageIds.forEach(id => {
    const imgData = inlineImages[id];
    if (imgData) {
      const { ext, mimeType } = resolveImageType(imgData);

      const binaryData = dataUriToUint8Array(imgData.base64);
      imagesFolder.file(`${id}.${ext}`, binaryData, { binary: true });

      manifestImages.push({
        id: id,
        fileName: `${id}.${ext}`,
        mimeType: mimeType
      });
    }
  });

  // 5b. Write the cover image and build its dedicated cover page.
  // The cover is stored on metadata.cover as { base64, mimeType, width, height }.
  const cover = metadata.cover;
  let coverInfo = null;
  if (cover && cover.base64) {
    const { ext, mimeType } = resolveImageType(cover);
    const fileName = `cover.${ext}`;
    imagesFolder.file(fileName, dataUriToUint8Array(cover.base64), { binary: true });

    // When the pixel dimensions are known, wrap the image in an SVG with a
    // viewBox: this is the standard way to get a cover that scales to fill any
    // reader screen without distortion. Without dimensions there is no valid
    // viewBox, so fall back to a plain <img> sized by CSS.
    const hasDimensions = Number(cover.width) > 0 && Number(cover.height) > 0;
    const coverBody = hasDimensions
      ? `<div class="cover-wrapper">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
         version="1.1" width="100%" height="100%" viewBox="0 0 ${cover.width} ${cover.height}"
         preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cover">
      <image width="${cover.width}" height="${cover.height}" xlink:href="images/${fileName}"/>
    </svg>
  </div>`
      : `<div class="cover-wrapper">
    <img class="cover-image" src="images/${fileName}" alt="Cover" />
  </div>`;

    const coverXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(metadata.language || 'en')}">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body class="cover-page" epub:type="cover">
  ${coverBody}
</body>
</html>`;
    oebps.file('cover.xhtml', coverXhtml);

    // An XHTML document containing inline SVG must declare the "svg" property
    coverInfo = { fileName, mimeType, isSvgWrapped: hasDimensions };
  }

  // 6. Create OEBPS/toc.ncx (EPUB 2 backward compatibility)
  const uuid = generateUUID();
  const modifiedTime = new Date().toISOString().split('.')[0] + 'Z';

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(metadata.title || 'Untitled Novel')}</text>
  </docTitle>
  <navMap>
    ${chapters.map((ch, idx) => `
    <navPoint id="navpoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel>
        <text>${escapeXml(ch.title)}</text>
      </navLabel>
      <content src="chapters/chapter_${idx + 1}.xhtml"/>
    </navPoint>`).join('')}
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  // 7. Create OEBPS/nav.xhtml (EPUB 3 Table of Contents)
  const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(metadata.language || 'en')}">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
  <style>
    nav#toc ol { list-style-type: none; padding-left: 0; }
    nav#toc li { margin-bottom: 0.6em; }
    nav#toc a { text-decoration: none; color: #0000FF; }
  </style>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${chapters.map((ch, idx) => `<li><a href="chapters/chapter_${idx + 1}.xhtml">${escapeXml(ch.title)}</a></li>`).join('\n      ')}
    </ol>
  </nav>
${coverInfo ? `  <nav epub:type="landmarks" id="landmarks" hidden="hidden">
    <h1>Landmarks</h1>
    <ol>
      <li><a epub:type="cover" href="cover.xhtml">Cover</a></li>
      <li><a epub:type="toc" href="nav.xhtml">Table of Contents</a></li>
      <li><a epub:type="bodymatter" href="chapters/chapter_1.xhtml">Start of Content</a></li>
    </ol>
  </nav>
` : ''}</body>
</html>`;
  oebps.file('nav.xhtml', navXhtml);

  // 8. Create OEBPS/content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(metadata.title || 'Untitled Novel')}</dc:title>
    <dc:creator id="creator">${escapeXml(metadata.author || 'Anonymous Creator')}</dc:creator>
    <dc:identifier id="BookID">urn:uuid:${uuid}</dc:identifier>
    <dc:language>${escapeXml(metadata.language || 'en')}</dc:language>
    <dc:publisher>${escapeXml(metadata.publisher || 'Self-Published')}</dc:publisher>
    <meta property="dcterms:modified">${modifiedTime}</meta>${coverInfo ? `
    <!-- EPUB 2 style cover reference: still what Kindle/KDP looks for -->
    <meta name="cover" content="cover-image"/>` : ''}
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="stylesheet" href="styles.css" media-type="text/css"/>${coverInfo ? `
    <item id="cover-image" href="images/${coverInfo.fileName}" media-type="${coverInfo.mimeType}" properties="cover-image"/>
    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"${coverInfo.isSvgWrapped ? ' properties="svg"' : ''}/>` : ''}
    ${chapters.map((ch, idx) => `<item id="chapter_${idx + 1}" href="chapters/chapter_${idx + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
    ${manifestImages.map(img => `<item id="img_${img.id}" href="images/${img.fileName}" media-type="${img.mimeType}"/>`).join('\n    ')}
  </manifest>
  <spine toc="ncx">${coverInfo ? `
    <itemref idref="cover-page" linear="yes"/>` : ''}
    ${chapters.map((ch, idx) => `<itemref idref="chapter_${idx + 1}"/>`).join('\n    ')}
  </spine>${coverInfo ? `
  <guide>
    <reference type="cover" title="Cover" href="cover.xhtml"/>
  </guide>` : ''}
</package>`;
  oebps.file('content.opf', contentOpf);

  // 9. Generate the Zip file as an ArrayBuffer
  return await zip.generateAsync({ type: 'arraybuffer' });
}
