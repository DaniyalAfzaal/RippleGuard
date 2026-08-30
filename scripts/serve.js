#!/usr/bin/env node
/**
 * Tiny static server for the RippleGuard UI (zero dependencies).
 * Usage: node scripts/serve.js   ->  http://localhost:4173
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 4173;

function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    // Run the real release gate from the UI.
    if (req.method === 'POST' && urlPath === '/api/run-gate') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        let strict = true;
        try { strict = JSON.parse(body || '{}').strict !== false; } catch {}
        // Before Bob has produced a real ledger, gate the example ledger so
        // the button still demonstrates the mechanism (clearly labeled).
        // Strict hash checks are skipped for the example: its "tested"
        // statuses are illustrative while the fixture is intentionally
        // still in its pre-change state.
        let note = '';
        let usingExample = false;
        if (!fs.existsSync(path.join(ROOT, 'artifacts', 'impact-ledger.json'))) {
          const example = path.join(ROOT, 'artifacts', 'impact-ledger.example.json');
          if (fs.existsSync(example)) {
            usingExample = true;
            note =
              'NOTE: no Bob-produced ledger yet (artifacts/impact-ledger.json missing).\n' +
              'Gating the EXAMPLE ledger instead' +
              (strict ? '; strict hash checks skipped (pre-change fixture is intentionally unchanged).' : '.') +
              '\n\n';
          }
        }
        const args = ['scripts/ripple-gate.js'];
        if (strict && !usingExample) args.push('--strict');
        if (usingExample) args.push('--ledger', 'artifacts/impact-ledger.example.json');
        const r = spawnSync(process.execPath, args, {
          cwd: ROOT,
          encoding: 'utf8',
          timeout: 120000,
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify({
            exit_code: r.status,
            output: note + stripAnsi((r.stdout || '') + (r.stderr || '')),
          })
        );
      });
      return;
    }
    if (urlPath === '/') {
      // Redirect (not rewrite) so the page's relative asset paths resolve
      // against /ui/ in the browser.
      res.writeHead(302, { Location: '/ui/index.html' });
      return res.end();
    }
    const file = path.join(ROOT, urlPath);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(fs.readFileSync(file));
  })
  .listen(PORT, () => {
    console.log(`RippleGuard UI: http://localhost:${PORT}`);
  });
