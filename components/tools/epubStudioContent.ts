/**
 * Copy and reference data for /tools/epub-studio.
 *
 * Single source of truth: the page renders these on screen *and* derives its
 * JSON-LD (SoftwareApplication featureList, FAQPage, HowTo) from the same
 * arrays, so the structured data can never drift from the visible content —
 * which is what search engines check for.
 */

export const EPUB_STUDIO_NAME = "EPUB Studio";

export const EPUB_STUDIO_TAGLINE = "KDP-optimized EPUB creator";

export const EPUB_STUDIO_INTRO =
  "EPUB Studio turns a manuscript into a finished EPUB 3 ebook without leaving your browser. Write or paste your chapters in a light markup, watch a Kindle-style preview update as you type, set your metadata, typography and cover, then download a file you can upload straight to Kindle Direct Publishing. Your work autosaves in the browser as you write, and there is no account, no upload and no server — the ebook is assembled on your own machine.";

export const features = [
  {
    title: "Live Kindle-style preview",
    body: "A mocked e-reader shows the current chapter exactly as it will be typeset — font, alignment, size, drop caps and chapter-title spacing all update as you change them.",
  },
  {
    title: "Chapter management",
    body: "Add, rename, reorder and delete chapters in the sidebar. Each chapter becomes its own document in the EPUB spine, so every chapter starts on a fresh page.",
  },
  {
    title: "Cover image with KDP checks",
    body: "Drop in a cover and the tool measures it, shows the pixel dimensions, and warns when the resolution or aspect ratio falls outside Kindle Direct Publishing's guidance. The warnings never block an export.",
  },
  {
    title: "Chapter title styling",
    body: "Control the space above and below chapter titles, plus size, alignment, font, weight, letter case, letter spacing and an optional hairline rule — applied consistently across the whole book.",
  },
  {
    title: "Typography controls",
    body: "Choose a serif or sans body face, justified, left or centered text, and one of four base font sizes. Settings are written into the ebook's stylesheet in relative units so they scale with the reader's own font size.",
  },
  {
    title: "Inline images and drop caps",
    body: "Insert images with optional italic captions anywhere in a chapter, and switch on a decorative drop cap for a chapter's opening letter.",
  },
  {
    title: "Scene and page breaks",
    body: "Mark a scene change with a centered ornament, or force a real page break — the preview labels breaks visibly while the exported book uses proper page-break rules.",
  },
  {
    title: "Autosaves as you write",
    body: "Your chapters, settings and cover are kept in this browser as you work, so a refresh or an accidental tab close won't cost you anything. The saved copy is cleared the moment you export.",
  },
  {
    title: "Nothing leaves your browser",
    body: "The manuscript, the images and the finished EPUB never leave your device — nothing is uploaded to a server, stored in an account or logged, so unpublished work stays private.",
  },
];

export const steps = [
  {
    title: "Write or paste your chapters",
    body: "Start from the demo chapter or replace it with your own text. Use the toolbar for bold, italic, headings, blockquotes, scene breaks and page breaks — each button inserts a plain-text marker, so the manuscript stays readable.",
  },
  {
    title: "Set your metadata",
    body: "Open the Settings tab and fill in the title, author, publisher and language code. These become the ebook's Dublin Core metadata, which is what a store or reader displays.",
  },
  {
    title: "Add a cover",
    body: "Kindle Direct Publishing recommends a 1:1.6 cover, ideally 1600 × 2560 pixels and at least 1000 pixels tall. The tool measures your image and flags anything outside that range.",
  },
  {
    title: "Style the book",
    body: "Pick the body font, alignment and size, then tune chapter titles — spacing, size, case and alignment — until the preview reads the way you want it to.",
  },
  {
    title: "Export and upload",
    body: "Press Export EPUB. The file downloads immediately and is ready to upload to KDP or to open in Apple Books, Calibre or any EPUB reader for a final check. Exporting also clears the autosaved draft, since the book now exists as a file on your machine.",
  },
];

export const markup = [
  { syntax: "**bold**", result: "Bold text" },
  { syntax: "*italic*", result: "Italic text" },
  { syntax: "~~struck~~", result: "Strikethrough text" },
  { syntax: "# Heading", result: "A section heading within the chapter" },
  { syntax: "## Subheading", result: "A smaller subheading" },
  { syntax: "> quoted line", result: "Block quotation, for epigraphs and letters" },
  { syntax: "[center]text[/center]", result: "Centered, non-indented paragraph" },
  { syntax: "[scenebreak]", result: "Centered * * * ornament, no page break" },
  { syntax: "[pagebreak]", result: "A real page break in the finished ebook" },
  { syntax: "![caption](img:ID)", result: "Inline image with an optional italic caption" },
  { syntax: "blank line", result: "Starts a new paragraph" },
];

export const faqs = [
  {
    q: "Is my manuscript uploaded anywhere?",
    a: "No. EPUB Studio runs entirely in your browser. The text, the images and the finished EPUB are held in the page's memory and the file is assembled on your own machine, so nothing is sent to a server, stored or logged.",
  },
  {
    q: "Does my work save automatically?",
    a: "Yes. Your book is saved to this browser's local storage as you type, so refreshing the page or closing the tab by accident will not lose it — reopen the tool and your chapters, settings and cover are waiting. The saved copy is cleared once you export, and you can discard it at any time with 'Start a new book' in the Settings tab.",
  },
  {
    q: "Where is the autosaved draft stored?",
    a: "In your own browser, using local storage on the device you are working on. It is never sent anywhere, but it does persist on that machine, so avoid drafting private work on a shared or public computer — or clear it with 'Start a new book' when you finish. Very large cover or inline images can exceed the browser's storage limit; if that happens the tool keeps your text, drops the images from the saved copy, and tells you so in the header.",
  },
  {
    q: "Is EPUB Studio free?",
    a: "Yes. It is free to use, with no account, no sign-up and no limit on the number of books you create.",
  },
  {
    q: "Can I upload the file to Kindle Direct Publishing?",
    a: "Yes. The tool exports EPUB 3, which is the format KDP recommends. Each chapter is its own document in the spine, the cover is declared both the EPUB 3 way and in the legacy form Kindle still reads, and a classic NCX table of contents is included alongside the EPUB 3 navigation for older readers.",
  },
  {
    q: "What cover size does KDP need?",
    a: "Kindle Direct Publishing recommends a 1:1.6 ratio — 1600 × 2560 pixels is the usual target — and at least 1000 pixels on the tall edge. EPUB Studio measures your image on selection and warns when it is too small or an unusual shape, but it never blocks the export.",
  },
  {
    q: "Which formatting does it support?",
    a: "Bold, italic and strikethrough, headings and subheadings, block quotations, centered passages, scene-break ornaments, real page breaks, inline images with captions, and an optional drop cap on a chapter's first letter.",
  },
  {
    q: "Can I import a DOCX or an existing EPUB?",
    a: "No. EPUB Studio is a writing and formatting tool rather than a converter — you write in it or paste plain text into it. Pasting from a word processor works fine; the formatting is re-applied with the toolbar.",
  },
  {
    q: "Does it work on a phone or tablet?",
    a: "It works, but it is built for a desktop screen. On narrow viewports the three columns stack vertically and the drag handles are removed, which is usable for edits but cramped for writing a whole book.",
  },
  {
    q: "Should I check the file before publishing?",
    a: "Yes — always open the exported EPUB in Apple Books, Calibre or another reader before uploading, and confirm the cover, the table of contents and your page breaks look right. Running the official epubcheck tool is a good extra step for a book you intend to sell.",
  },
];
