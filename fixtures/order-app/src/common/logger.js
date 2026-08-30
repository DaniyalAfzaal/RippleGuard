/**
 * Minimal structured logger.
 */
'use strict';

function log(level, msg, extra) {
  const entry = { ts: new Date().toISOString(), level, msg, ...extra };
  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (msg, extra) => log('info', msg, extra),
  warn: (msg, extra) => log('warn', msg, extra),
  error: (msg, extra) => log('error', msg, extra),
};
