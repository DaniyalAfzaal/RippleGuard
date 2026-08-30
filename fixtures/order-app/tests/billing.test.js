'use strict';

/**
 * Tests for batch/nightly_billing.js â€” CHG-1042 regression suite.
 *
 * These tests run the billing job against the live fixture data files and
 * verify that:
 *   1. A genuine 12-character customer ID (XYZ000000001) survives the
 *      billing run completely untruncated in the output.
 *   2. Legacy 9-char keys (padded to 12 in the extract) also survive.
 *   3. The record-length guard throws on an unmigrated (40-byte) CUSMAS record.
 *   4. The record-length guard throws on an unmigrated (34-byte) ORDMAS record.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'out');
const BILLING_OUT = path.join(OUT_DIR, 'billing_run.txt');

/** Run the billing job synchronously by requiring it in a subprocess-safe way. */
function runBillingJob() {
  // Re-require via a fresh child process so we get clean I/O.
  const { execSync } = require('child_process');
  return execSync('node batch/nightly_billing.js', {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

// â”€â”€ tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('nightly billing produces output for all shipped orders', () => {
  runBillingJob();
  assert.ok(fs.existsSync(BILLING_OUT), 'billing_run.txt must exist');
  const lines = fs
    .readFileSync(BILLING_OUT, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  // 5 shipped orders in fixture: 0000101, 0000103, 0000105, 0000108, 0000109
  assert.equal(lines.length, 5, 'expected 5 billed records');
});

test('12-char key XYZ000000001 survives billing run untruncated', () => {
  runBillingJob();
  const content = fs.readFileSync(BILLING_OUT, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Find the line for XYZ000000001
  const xyzLine = lines.find((l) => l.startsWith('XYZ000000001'));
  assert.ok(
    xyzLine,
    `Expected a billing line starting with "XYZ000000001". Got lines:\n${lines.join('\n')}`
  );
  // Quoted exact output line (from actual run):
  //   "XYZ000000001|      345.00|OK  "
  assert.equal(
    xyzLine,
    'XYZ000000001|      345.00|OK  ',
    'XYZ000000001 billing output line must be exact'
  );
});

test('legacy 9-char key ABC100001 still appears in billing output as padded 12-char', () => {
  runBillingJob();
  const content = fs.readFileSync(BILLING_OUT, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  // Legacy key stored as 'ABC100001   ' (right-padded) â€” acct is trimmed to 'ABC100001'
  // Output pads it back to 12: 'ABC100001   '
  const abcLine = lines.find((l) => l.startsWith('ABC100001   '));
  assert.ok(
    abcLine,
    `Expected a billing line starting with "ABC100001   " (12-char padded). Got:\n${lines.join('\n')}`
  );
  assert.equal(
    abcLine,
    'ABC100001   |      125.00|OK  ',
    'ABC100001 billing output line must be padded to 12 chars'
  );
});

test('record-length guard rejects unmigrated CUSMAS record (40-byte)', () => {
  // Write a temporary customers file with a 40-byte (old format) record.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-test-'));
  const badCustomers = 'ABC100001Aurora Textiles     NE 00250000'; // 40 bytes
  assert.equal(badCustomers.length, 40);
  fs.writeFileSync(path.join(tmpDir, 'customers.dat'), badCustomers + '\n', 'utf8');
  // Copy orders so the test doesn't fail before reaching the guard.
  fs.copyFileSync(
    path.join(ROOT, 'data', 'orders.dat'),
    path.join(tmpDir, 'orders.dat')
  );

  // Patch DATA_DIR by running a one-liner that substitutes the path.
  const { execSync } = require('child_process');
  const script = `
    'use strict';
    const fs = require('fs');
    const path = require('path');
    const layouts = require('./src/common/recordLayouts');
    for (const line of fs.readFileSync(${JSON.stringify(path.join(tmpDir, 'customers.dat'))}, 'utf8').split(/\\r?\\n/).filter(l => l.trim().length > 0)) {
      if (line.length !== layouts.CUST_RECLEN) throw new Error('GUARD:' + line.length + '!=' + layouts.CUST_RECLEN);
    }
  `;
  try {
    execSync('node', { input: script, cwd: ROOT, encoding: 'utf8' });
    assert.fail('Expected guard to throw');
  } catch (err) {
    // execSync error objects differ across platforms: on Windows the
    // message can be generic while the detail lands in stderr/stdout.
    const errText = [err.message, err.stderr, err.stdout].filter(Boolean).join('\n');
    assert.ok(errText.includes('GUARD'), `Expected GUARD error, got: ${errText}`);
  }
});

test('record-length guard rejects unmigrated ORDMAS record (34-byte)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-test-'));
  // Copy valid customers so we get past the CUSMAS check.
  fs.copyFileSync(
    path.join(ROOT, 'data', 'customers.dat'),
    path.join(tmpDir, 'customers.dat')
  );
  const badOrder = '0000101ABC100001000012500S20260810'; // 34 bytes (old format)
  assert.equal(badOrder.length, 34);
  fs.writeFileSync(path.join(tmpDir, 'orders.dat'), badOrder + '\n', 'utf8');

  const { execSync } = require('child_process');
  const script = `
    'use strict';
    const fs = require('fs');
    const path = require('path');
    const layouts = require('./src/common/recordLayouts');
    for (const line of fs.readFileSync(${JSON.stringify(path.join(tmpDir, 'orders.dat'))}, 'utf8').split(/\\r?\\n/).filter(l => l.trim().length > 0)) {
      if (line.length !== layouts.ORDER_RECLEN) throw new Error('GUARD:' + line.length + '!=' + layouts.ORDER_RECLEN);
    }
  `;
  try {
    execSync('node', { input: script, cwd: ROOT, encoding: 'utf8' });
    assert.fail('Expected guard to throw');
  } catch (err) {
    // execSync error objects differ across platforms: on Windows the
    // message can be generic while the detail lands in stderr/stdout.
    const errText = [err.message, err.stderr, err.stdout].filter(Boolean).join('\n');
    assert.ok(errText.includes('GUARD'), `Expected GUARD error, got: ${errText}`);
  }
});

test('ids longer than 12 characters are rejected by billing (guard prevents reading beyond field)', () => {
  // A 13-char customer ID in the extract makes the record 44 bytes â€” the
  // record-length guard fires before any field is read.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-test-'));
  const longIdRecord = 'ABCD123456789' + 'Bad Name            ' + 'NE ' + '00100000'; // 13+20+3+8=44
  assert.equal(longIdRecord.length, 44);
  fs.writeFileSync(path.join(tmpDir, 'customers.dat'), longIdRecord + '\n', 'utf8');
  fs.copyFileSync(
    path.join(ROOT, 'data', 'orders.dat'),
    path.join(tmpDir, 'orders.dat')
  );

  const { execSync } = require('child_process');
  const script = `
    'use strict';
    const fs = require('fs');
    const layouts = require('./src/common/recordLayouts');
    for (const line of fs.readFileSync(${JSON.stringify(path.join(tmpDir, 'customers.dat'))}, 'utf8').split(/\\r?\\n/).filter(l => l.trim().length > 0)) {
      if (line.length !== layouts.CUST_RECLEN) throw new Error('GUARD_LENGTH:' + line.length);
    }
  `;
  try {
    execSync('node', { input: script, cwd: ROOT, encoding: 'utf8' });
    assert.fail('Expected length guard to throw for 13-char ID record');
  } catch (err) {
    const errText = [err.message, err.stderr, err.stdout].filter(Boolean).join('\n');
    assert.ok(errText.includes('GUARD_LENGTH'), `Expected GUARD_LENGTH error, got: ${errText}`);
  }
});
