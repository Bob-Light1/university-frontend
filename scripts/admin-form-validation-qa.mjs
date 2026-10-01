/**
 * @file admin-form-validation-qa.mjs
 * @description AP-06 schema regressions using the installed Yup and application schema.
 * ADMIN_SCHEMA_SOURCE can point to the preserved pre-fix schema for red evidence.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaFile = path.join(root, 'src/yupSchema/financeSchemas.js');
const source = await fs.readFile(process.env.ADMIN_SCHEMA_SOURCE || schemaFile, 'utf8');
const bundled = await build({ stdin: { contents: source + "\nexport { PAYMENT_METHODS };", resolveDir: path.dirname(schemaFile) },
  bundle: true, format: 'esm', platform: 'node', write: false });
const { feeSchema, buildPaymentSchema, PAYMENT_METHODS } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const cases = [
  ['fee', feeSchema, { student: '507f1f77bcf86cd799439011', label: 'Synthetic tuition', amountDue: 10000 }, 'dueDate'],
  ['payment', buildPaymentSchema(7500), { amount: 2500, method: PAYMENT_METHODS[0] }, 'paidAt'],
];
let failures = 0;
for (const [name, schema, base, field] of cases) {
  for (const date of ['', null, undefined, '2026-09-30']) {
    try { await schema.validate({ ...base, [field]: date }); }
    catch { failures++; process.stderr.write(`${name}: rejected optional date ${JSON.stringify(date)}\n`); }
  }
  await assert.rejects(schema.validate({ ...base, [field]: 'not-a-date' }));
}
await assert.rejects(buildPaymentSchema(7500).validate({ amount: 7501, method: PAYMENT_METHODS[0], paidAt: '' }));
assert.equal(failures, 0, 'Optional blank finance dates must submit');
process.stdout.write('11 finance validation cases passed.\n');
