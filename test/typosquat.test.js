const test = require('node:test');
const assert = require('node:assert');
const { checkTyposquat } = require('../src/typosquat');

test('flags a one-character-off name against a popular package', () => {
  const result = checkTyposquat('expres');
  assert.ok(result, 'expected a typosquat finding for "expres"');
  assert.strictEqual(result.similarTo, 'express');
});

test('does not flag the popular package itself', () => {
  assert.strictEqual(checkTyposquat('express'), null);
});

test('does not flag an unrelated, distinct name', () => {
  assert.strictEqual(checkTyposquat('my-totally-unique-internal-tool-xyz'), null);
});
