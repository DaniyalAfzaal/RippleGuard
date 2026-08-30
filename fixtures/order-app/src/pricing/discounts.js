/**
 * Volume discount rules. Region-based, no customer key handling here.
 */
'use strict';

const REGION_DISCOUNT = {
  NE: 0.02,
  SE: 0.015,
  MW: 0.025,
  NW: 0.01,
  SW: 0.02,
};

function discountFor(region, amount) {
  const rate = REGION_DISCOUNT[region] || 0;
  if (amount < 100) return 0;
  return Math.round(amount * rate * 100) / 100;
}

module.exports = { discountFor };
