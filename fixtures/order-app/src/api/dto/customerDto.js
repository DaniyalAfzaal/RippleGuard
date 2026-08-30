/**
 * Wire contracts for the OrderCore REST API.
 * CHG-1042: customerId maxLength widened 9→12; pattern updated to
 *           accept both 9-char (AAA999999) and 12-char (AAA999999999) ids.
 */
'use strict';

const customerDtoSchema = Object.freeze({
  type: 'object',
  properties: {
    customerId: { type: 'string', maxLength: 12, pattern: '^[A-Z]{3}[0-9]{6}([0-9]{3})?$' },
    name: { type: 'string', maxLength: 20 },
    region: { type: 'string', maxLength: 3 },
    creditLimit: { type: 'number' },
  },
  required: ['customerId', 'name'],
});

function toCustomerDto(customer) {
  return {
    customerId: customer.id,
    name: customer.name,
    region: customer.region,
    creditLimit: customer.creditLimit,
  };
}

function toOrderDto(order) {
  return {
    orderNo: order.orderNo,
    customerId: order.custNo,
    amount: order.amount,
    status: order.status,
    statusName: order.statusName,
    statusDate: order.statusDate,
  };
}

// R2: order-status DTO shape
function toOrderStatusDto(order) {
  return {
    orderNo: order.orderNo,
    customerId: order.custNo,
    status: order.status,
    statusName: order.statusName,
    statusDate: order.statusDate,
  };
}

module.exports = { customerDtoSchema, toCustomerDto, toOrderDto, toOrderStatusDto };
