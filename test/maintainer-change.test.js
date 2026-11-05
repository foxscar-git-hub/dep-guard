const test = require('node:test');
const assert = require('node:assert');
const { checkMaintainerChange } = require('../src/maintainer-change');

function packumentWithPublishers(publisherSequence, { recent = true } = {}) {
  const versions = {};
  const time = {};
  const base = recent ? Date.now() - 10 * 24 * 60 * 60 * 1000 : Date.now() - 400 * 24 * 60 * 60 * 1000;
  publisherSequence.forEach((user, i) => {
    const v = `1.${i}.0`;
    versions[v] = { _npmUser: { name: user } };
    time[v] = new Date(base - (publisherSequence.length - i) * 30 * 24 * 60 * 60 * 1000).toISOString();
  });
  return { name: 'example', versions, time };
}

test('flags a new publisher after a long single-publisher history', () => {
  const packument = packumentWithPublishers(['alice', 'alice', 'alice', 'alice', 'alice', 'mallory']);
  const result = checkMaintainerChange(packument);
  assert.ok(result, 'expected a maintainer-change finding');
  assert.strictEqual(result.newPublisher, 'mallory');
  assert.strictEqual(result.previousPublisher, 'alice');
});

test('does not flag routine co-maintainer rotation among known publishers', () => {
  const packument = packumentWithPublishers(['alice', 'bob', 'alice', 'bob', 'alice', 'bob']);
  assert.strictEqual(checkMaintainerChange(packument), null);
});

test('does not flag short histories', () => {
  const packument = packumentWithPublishers(['alice', 'mallory']);
  assert.strictEqual(checkMaintainerChange(packument), null);
});

test('does not flag an old new-publisher event outside the recency window', () => {
  const packument = packumentWithPublishers(['alice', 'alice', 'alice', 'alice', 'alice', 'mallory'], { recent: false });
  assert.strictEqual(checkMaintainerChange(packument), null);
});
