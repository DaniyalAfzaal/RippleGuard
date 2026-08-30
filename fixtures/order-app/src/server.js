/**
 * OrderCore API server (zero dependencies).
 * Run: node fixtures/order-app/src/server.js
 */
'use strict';

const http = require('http');
const { handle } = require('./api/routes');

const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    try {
      handle(req, res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  })
  .listen(PORT, () => {
    console.log(`OrderCore API listening on http://localhost:${PORT}`);
  });
