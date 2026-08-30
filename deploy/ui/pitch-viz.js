/* Shared blast-radius + seed-map for the 90s pitch. Same geometry as
   how-it-works #mini-map and the analysis seed map. Data: RIPPLE_LIVE. */
(function (global) {
  'use strict';

  const DOMAIN_COLORS = {
    database: '#60a5fa', code: '#22d3ee', batch: '#e879f9',
    api: '#818cf8', test: '#38bdf8', config: '#a78bfa', docs: '#94a3b8',
  };
  const DOMAIN_LABEL = {
    database: 'Data', code: 'Code', batch: 'Batch',
    api: 'API', test: 'Test', config: 'Config', docs: 'Docs',
  };
  const PALETTE = { tested: '#34d399', changed: '#fbbf24', open: '#fb7185', waived: '#71717a' };
  const RISK_R = { high: 118, medium: 158, low: 194 };
  const RISK_R_SEED = { high: 72, medium: 108, low: 142 };
  const glyph = { tested: '✓', open: '✕', changed: '~', waived: '–' };
  const AGENTS = [
    { name: 'data-explorer', label: 'Data', domains: ['database'], color: '#60a5fa', hunt: 'widths · extracts' },
    { name: 'code-explorer', label: 'Code', domains: ['code'], color: '#22d3ee', hunt: 'aliases · drift copies' },
    { name: 'batch-explorer', label: 'Batch', domains: ['batch', 'config', 'docs'], color: '#e879f9', hunt: 'byte offsets · runbook' },
    { name: 'api-explorer', label: 'API', domains: ['api'], color: '#818cf8', hunt: 'routes · payloads' },
    { name: 'test-explorer', label: 'Test', domains: ['test'], color: '#38bdf8', hunt: '9-char fixtures' },
  ];
  const GREP_MISSES = [
    { id: 'SVC_ORDER_SERVICE', tag: 'CUSID', quote: 'const CUSID_LEN = 9;' },
    { id: 'BATCH_NIGHTLY_BILLING', tag: 'substring(0, 9)', quote: 'const acct = line.substring(0, 9);' },
    { id: 'CONFIG_FEED_LAYOUT', tag: 'CUST_KEY', quote: '{ "name": "CUST_KEY", "width": 9 }' },
  ];

  const polar = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const arcPath = (cx, cy, r, a0, a1) => {
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    return 'M ' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A ' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  };
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  function artifacts() {
    const live = global.RIPPLE_LIVE;
    return (live && live.ledger && live.ledger.artifacts) || [];
  }

  function layout(arts, CX, CY, radii) {
    const domains = [...new Set(arts.map((a) => a.domain || 'other'))];
    const nodes = [];
    const sectors = [];
    const GAP = 0.07;
    let cursor = -Math.PI / 2;
    for (const d of domains) {
      const group = arts.filter((a) => (a.domain || 'other') === d);
      const span = (group.length / Math.max(arts.length, 1)) * Math.PI * 2;
      sectors.push({ domain: d, a0: cursor + GAP / 2, a1: cursor + span - GAP / 2 });
      group.forEach((a, i) => {
        const angle = cursor + span * ((i + 0.5) / group.length);
        const tier = radii[a.risk] ? a.risk : 'low';
        const [x, y] = polar(CX, CY, radii[tier], angle);
        nodes.push({ a: a, x: x, y: y });
      });
      cursor += span;
    }
    return { domains: domains, nodes: nodes, sectors: sectors };
  }

  function statusOf(a, opts) {
    if (opts && typeof opts.statusOf === 'function') return opts.statusOf(a);
    if (opts && opts.forceOpen && opts.forceOpen.indexOf(a.id) !== -1) return 'open';
    return a.status || 'open';
  }

  function drawBlastRadius(svg, opts) {
    opts = opts || {};
    const arts = artifacts();
    if (!svg) return [];
    if (!arts.length) {
      svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#77777f" font-size="13">Load gate-state.live.js</text>';
      return [];
    }
    const W = opts.size || 520;
    const H = W;
    const CX = W / 2;
    const CY = H / 2;
    const { nodes, sectors } = layout(arts, CX, CY, RISK_R);
    const ringOpacity = [0.3, 0.2, 0.12];
    const rings = Object.values(RISK_R).map((r, i) =>
      '<circle class="ring-guide" cx="' + CX + '" cy="' + CY + '" r="' + r + '" stroke-opacity="' + (ringOpacity[i] ?? 0.12) + '"></circle>'
    ).join('');
    const R_ARC = Math.round(W * 0.438);
    const arcs = sectors.map((s) => {
      const mid = (s.a0 + s.a1) / 2;
      const label = (s.domain || '').toUpperCase();
      const halfGap = ((label.length * 6.2) / 2 + 10) / R_ARC;
      const [lx, ly] = polar(CX, CY, R_ARC, mid);
      const c = DOMAIN_COLORS[s.domain] || '#94a3b8';
      const seg = (a0, a1) => a1 - a0 > 0.03
        ? '<path d="' + arcPath(CX, CY, R_ARC, a0, a1) + '" fill="none" stroke="' + c + '" stroke-width="1.4"></path>'
        : '';
      const text = opts.hideArcs
        ? ''
        : '<text x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) + '" fill="' + c + '" font-size="8.5" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" letter-spacing="0.6">' + esc(label) + '</text>';
      return seg(s.a0, mid - halfGap) + seg(mid + halfGap, s.a1) + text;
    }).join('');
    const hub = opts.dim ? 36 : 38;
    const spokes = nodes.map((n) => {
      const dx = n.x - CX, dy = n.y - CY;
      const len = Math.hypot(dx, dy) || 1;
      const x1 = CX + (dx / len) * (hub + 6), y1 = CY + (dy / len) * (hub + 6);
      const x2 = n.x - (dx / len) * 16, y2 = n.y - (dy / len) * 16;
      return '<line class="spoke" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"></line>';
    }).join('');
    const nodeSvg = nodes.map((n) => {
      const st = statusOf(n.a, opts);
      const c = PALETTE[st] || '#22d3ee';
      return '<g class="hit-node" data-id="' + esc(n.a.id) + '" data-domain="' + esc(n.a.domain || '') + '">' +
        '<circle class="halo" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="16" fill="' + c + '" fill-opacity="0.12"></circle>' +
        '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="14" fill="#141417" stroke="' + c + '" stroke-width="1.7"></circle>' +
        '<text x="' + n.x.toFixed(1) + '" y="' + (n.y + 3.6).toFixed(1) + '" fill="' + c + '" font-size="11" font-weight="700" text-anchor="middle">' + (glyph[st] || '·') + '</text>' +
        '</g>';
    }).join('');
    const gid = opts.glowId || 'pitchGlow' + Math.round(CX);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML =
      '<defs><radialGradient id="' + gid + '" cx="50%" cy="46%" r="55%"><stop offset="0%" stop-color="#0e3a46" stop-opacity=".55"/><stop offset="100%" stop-color="#0e3a46" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + Math.round(W * 0.48) + '" fill="url(#' + gid + ')"></circle>' +
      rings + spokes + arcs +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + hub + '" fill="#22d3ee" fill-opacity="0.1" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.2"></circle>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + (hub - 8) + '" fill="#0a0a0b" stroke="#22d3ee" stroke-opacity=".8" stroke-width="1.4"></circle>' +
      '<text x="' + CX + '" y="' + (CY + 4) + '" text-anchor="middle" fill="#ececee" font-size="11" font-weight="600" font-family="IBM Plex Sans, sans-serif">CHG-1042</text>' +
      nodeSvg;
    if (opts.dim) svg.classList.add('is-dim');
    return nodes;
  }

  function highlight(svg, ids) {
    if (!svg) return;
    const set = {};
    (ids || []).forEach((id) => { set[id] = true; });
    svg.querySelectorAll('.hit-node').forEach((g) => {
      const on = set[g.getAttribute('data-id')];
      g.classList.toggle('lit', !!on);
      g.classList.toggle('dimmed', ids && ids.length && !on);
    });
  }

  function drawSeedMap(svg) {
    const arts = artifacts();
    if (!svg) return [];
    const W = 320, H = 320, CX = 160, CY = 160;
    const { nodes } = layout(arts, CX, CY, RISK_R_SEED);
    const orbits = Object.values(RISK_R_SEED)
      .map((r) => '<circle class="seed-orbit" cx="' + CX + '" cy="' + CY + '" r="' + r + '"></circle>')
      .join('');
    const nodeSvg = nodes.map((n) =>
      '<circle class="seed-node" data-art="' + esc(n.a.id) + '" data-domain="' + esc(n.a.domain || '') + '" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="5.4" fill="' + (DOMAIN_COLORS[n.a.domain] || '#94a3b8') + '"></circle>'
    ).join('');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML =
      '<defs><radialGradient id="seedCoreGrad" cx="36%" cy="30%" r="72%"><stop offset="0%" stop-color="#ecfeff"/><stop offset="38%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#0e7490"/></radialGradient></defs>' +
      '<circle class="seed-wave" cx="' + CX + '" cy="' + CY + '" r="30"></circle>' +
      '<circle class="seed-wave" cx="' + CX + '" cy="' + CY + '" r="30" style="animation-delay:1.6s"></circle>' +
      orbits +
      '<circle cx="' + CX + '" cy="' + CY + '" r="40" fill="#22d3ee" fill-opacity="0.12"></circle>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="27" fill="url(#seedCoreGrad)"></circle>' +
      '<text x="' + CX + '" y="' + (CY + 7.5) + '" text-anchor="middle" fill="#f8fafc" font-size="21" font-weight="600" letter-spacing="1" font-family="IBM Plex Serif, Georgia, serif" paint-order="stroke" stroke="#083344" stroke-width="3">RG</text>' +
      nodeSvg;
    return nodes;
  }

  function popSeedDomain(svg, domain) {
    if (!svg) return;
    svg.querySelectorAll('.seed-node[data-domain="' + domain + '"]').forEach((n) => n.classList.add('in'));
  }

  function popSeedAll(svg) {
    if (!svg) return;
    svg.querySelectorAll('.seed-node').forEach((n) => n.classList.add('in'));
  }

  global.PitchViz = {
    AGENTS: AGENTS,
    GREP_MISSES: GREP_MISSES,
    DOMAIN_COLORS: DOMAIN_COLORS,
    DOMAIN_LABEL: DOMAIN_LABEL,
    artifacts: artifacts,
    drawBlastRadius: drawBlastRadius,
    drawSeedMap: drawSeedMap,
    highlight: highlight,
    popSeedDomain: popSeedDomain,
    popSeedAll: popSeedAll,
  };
})(window);
