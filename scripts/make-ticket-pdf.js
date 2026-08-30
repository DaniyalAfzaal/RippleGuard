#!/usr/bin/env node
/**
 * Renders markdown ticket files to simple text PDFs (zero dependencies).
 * Bob reads these PDFs natively (document understanding).
 *
 * Usage: node scripts/make-ticket-pdf.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const JOBS = [
  {
    src: path.join(ROOT, 'tickets', 'CHG-1042-customer-id-expansion.md'),
    out: path.join(ROOT, 'tickets', 'CHG-1042-customer-id-expansion.pdf'),
  },
  {
    src: path.join(ROOT, 'experiment', 'ticket-EXP-01.md'),
    out: path.join(ROOT, 'experiment', 'ticket-EXP-01.pdf'),
  },
];

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN = 56;
const FONT_SIZE = 10;
const LEADING = 14;
const MAX_CHARS = 88;
const LINES_PER_PAGE = Math.floor((PAGE_H - 2 * MARGIN) / LEADING);

function escapePdfText(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(line) {
  if (line.length <= MAX_CHARS) return [line];
  const words = line.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > MAX_CHARS) {
      if (cur) out.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Very light markdown -> display lines. Headings render bold. */
function mdToLines(md) {
  const lines = [];
  for (const raw of md.split(/\r?\n/)) {
    const h = raw.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      lines.push({ text: '', bold: false });
      for (const piece of wrap(h[2])) lines.push({ text: piece, bold: true });
      continue;
    }
    const plain = raw.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`/g, '');
    for (const piece of wrap(plain)) lines.push({ text: piece, bold: false });
    if (plain === '' && raw === '') lines.push({ text: '', bold: false });
  }
  // Collapse runs of blank lines
  const out = [];
  for (const l of lines) {
    if (l.text === '' && out.length && out[out.length - 1].text === '') continue;
    out.push(l);
  }
  return out;
}

function buildContentStream(pageLines) {
  let s = 'BT\n';
  s += `/F1 ${FONT_SIZE} Tf\n`;
  s += `${LEADING} TL\n`;
  s += `1 0 0 1 ${MARGIN} ${PAGE_H - MARGIN} Tm\n`;
  let currentBold = false;
  for (const line of pageLines) {
    if (line.bold !== currentBold) {
      s += `/${line.bold ? 'F2' : 'F1'} ${FONT_SIZE} Tf\n`;
      currentBold = line.bold;
    }
    s += `(${escapePdfText(line.text)}) Tj\nT*\n`;
  }
  s += 'ET\n';
  return s;
}

function makePdf(lines) {
  const pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([{ text: '(empty)', bold: false }]);

  const objects = [];
  const pageObjIds = [];
  const contentObjIds = [];
  // Object ids: 1 catalog, 2 pages, 3 F1, 4 F2, then per page: page + content
  let nextId = 5;
  for (let p = 0; p < pages.length; p++) {
    pageObjIds.push(nextId++);
    contentObjIds.push(nextId++);
  }

  objects[1] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /Count ${pages.length} >>\nendobj\n`;
  objects[3] = `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  objects[4] = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

  pages.forEach((pageLines, p) => {
    const contentId = contentObjIds[p];
    const pageId = pageObjIds[p];
    const stream = buildContentStream(pageLines);
    objects[pageId] =
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R ` +
      `/MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> ` +
      `/Contents ${contentId} 0 R >>\nendobj\n`;
    objects[contentId] =
      `${contentId} 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n` +
      stream +
      `endstream\nendobj\n`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < nextId; id++) {
    offsets[id] = Buffer.byteLength(pdf);
    pdf += objects[id];
  }
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${nextId}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let id = 1; id < nextId; id++) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${nextId} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

for (const job of JOBS) {
  if (!fs.existsSync(job.src)) {
    console.error(`skip (missing): ${job.src}`);
    continue;
  }
  const lines = mdToLines(fs.readFileSync(job.src, 'utf8'));
  fs.writeFileSync(job.out, makePdf(lines));
  console.log(`wrote ${job.out} (${lines.length} lines)`);
}
