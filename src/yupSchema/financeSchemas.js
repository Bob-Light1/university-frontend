'use strict';

/**
 * @file financeSchemas.js
 * @description Yup validation schemas for the Finance module forms.
 *   Mirror the backend models / controllers (single source of truth):
 *     - feeSchema             → studentFee.model.js + finance.controller.createFee
 *     - paymentSchema         → feePayment.model.js + finance.service.recordPayment
 *     - incomeSchema          → income.model.js + income.controller
 *     - expenseSchema         → expense.model.js + expense.controller
 *     - expenseCategorySchema → expense-category.model.js
 *   Enums are imported from financeConstants (kept in lockstep with the backend).
 */

import * as Yup from 'yup';
import {
  CURRENCIES,
  PAYMENT_METHODS,
  INCOME_SOURCES,
  INCOME_STATUSES,
  RECURRING_PERIODS,
  DEFAULT_CURRENCY,
} from '../campus/components/finance/financeConstants';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const objectId = (label = 'ID') =>
  Yup.string()
    .matches(OBJECT_ID_REGEX, `${label} must be a valid identifier`)
    .required(`${label} is required`);

const optionalObjectId = (label = 'ID') =>
  Yup.string()
    .transform((v) => (v === '' ? undefined : v))
    .matches(OBJECT_ID_REGEX, `${label} must be a valid identifier`)
    .notRequired();

// Supporting documents: an array of Cloudinary URLs (receipts / invoices).
const attachmentsField = Yup.array()
  .of(Yup.string().url('Each attachment must be a valid URL.'))
  .default([]);

// ─── Fee (student debt) ───────────────────────────────────────────────────────
export const feeSchema = Yup.object({
  student: objectId('Student'),

  label: Yup.string()
    .trim()
    .min(2, 'Label must be at least 2 characters.')
    .max(150, 'Label must not exceed 150 characters.')
    .required('Label is required.'),

  amountDue: Yup.number()
    .typeError('Amount must be a number.')
    .min(0, 'Amount cannot be negative.')
    .required('Amount is required.'),

  currency: Yup.string().oneOf(CURRENCIES, 'Invalid currency.').default(DEFAULT_CURRENCY),

  academicYear: Yup.string()
    .trim()
    .max(20, 'Academic year must not exceed 20 characters.')
    .nullable(),

  dueDate: Yup.date().nullable().optional(),

  notes: Yup.string().trim().max(500, 'Notes must not exceed 500 characters.').nullable(),
});

// ─── Payment (installment applied to a fee) ─────────────────────────────────────
/**
 * Builds the payment schema. The remaining balance is injected so the amount
 * is validated client-side as ≤ balance (the server is still authoritative).
 * @param {number} [balance] remaining balance to settle
 */
export const buildPaymentSchema = (balance = Infinity) =>
  Yup.object({
    amount: Yup.number()
      .typeError('Amount must be a number.')
      .moreThan(0, 'Amount must be greater than 0.')
      .max(balance, `Amount cannot exceed the remaining balance (${balance}).`)
      .required('Amount is required.'),

    method: Yup.string()
      .oneOf(PAYMENT_METHODS, 'Invalid payment method.')
      .required('Payment method is required.'),

    reference: Yup.string().trim().max(120, 'Reference is too long.').nullable(),

    paidAt: Yup.date().nullable().optional(),

    notes: Yup.string().trim().max(500, 'Notes must not exceed 500 characters.').nullable(),
  });

export const paymentSchema = buildPaymentSchema();

// ─── Income ─────────────────────────────────────────────────────────────────────
export const incomeSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, 'Title must be at least 2 characters.')
    .max(150, 'Title must not exceed 150 characters.')
    .required('Title is required.'),

  source: Yup.string().oneOf(INCOME_SOURCES, 'Invalid source.').required('Source is required.'),

  amount: Yup.number()
    .typeError('Amount must be a number.')
    .min(0, 'Amount cannot be negative.')
    .required('Amount is required.'),

  currency: Yup.string().oneOf(CURRENCIES, 'Invalid currency.').default(DEFAULT_CURRENCY),

  paymentMethod: Yup.string()
    .oneOf(PAYMENT_METHODS, 'Invalid payment method.')
    .required('Payment method is required.'),

  incomeDate: Yup.date()
    .typeError('A valid date is required.')
    .required('Income date is required.'),

  status: Yup.string().oneOf(INCOME_STATUSES, 'Invalid status.').default('received'),

  student: optionalObjectId('Student'),
  class: optionalObjectId('Class'),
  course: optionalObjectId('Course'),

  reference: Yup.string().trim().max(120, 'Reference is too long.').nullable(),
  description: Yup.string().trim().max(500, 'Description must not exceed 500 characters.').nullable(),
  attachments: attachmentsField,
  notes: Yup.string().trim().max(500, 'Notes must not exceed 500 characters.').nullable(),
});

// ─── Expense ──────────────────────────────────────────────────────────────────────
export const expenseSchema = Yup.object({
  expenseCategory: objectId('Category'),

  title: Yup.string()
    .trim()
    .min(2, 'Title must be at least 2 characters.')
    .max(150, 'Title must not exceed 150 characters.')
    .required('Title is required.'),

  amount: Yup.number()
    .typeError('Amount must be a number.')
    .min(0, 'Amount cannot be negative.')
    .required('Amount is required.'),

  currency: Yup.string().oneOf(CURRENCIES, 'Invalid currency.').default(DEFAULT_CURRENCY),

  paymentMethod: Yup.string()
    .oneOf(PAYMENT_METHODS, 'Invalid payment method.')
    .required('Payment method is required.'),

  expenseDate: Yup.date()
    .typeError('A valid date is required.')
    .required('Expense date is required.'),

  isRecurring: Yup.boolean().default(false),

  recurringPeriod: Yup.string().when('isRecurring', {
    is: true,
    then: (s) => s.oneOf(RECURRING_PERIODS, 'Invalid period.').required('Recurrence period is required.'),
    otherwise: (s) => s.transform(() => undefined).notRequired(),
  }),

  reference: Yup.string().trim().max(120, 'Reference is too long.').nullable(),
  description: Yup.string().trim().max(500, 'Description must not exceed 500 characters.').nullable(),
  attachments: attachmentsField,
  notes: Yup.string().trim().max(500, 'Notes must not exceed 500 characters.').nullable(),
});

// ─── Expense category ─────────────────────────────────────────────────────────────
export const expenseCategorySchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must not exceed 100 characters.')
    .required('Name is required.'),

  description: Yup.string().trim().max(300, 'Description must not exceed 300 characters.').nullable(),
});
