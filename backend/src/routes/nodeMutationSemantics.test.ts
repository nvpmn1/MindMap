import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveNodeDeleteLookup, resolveNodeUpdateOutcome } from './nodeMutationSemantics';

void test('resolveNodeUpdateOutcome returns conflict for stale expected_version', () => {
  const outcome = resolveNodeUpdateOutcome({
    updatedNode: null,
    expectedVersion: 2,
    currentNode: { version: 5 },
  });

  assert.deepEqual(outcome, {
    kind: 'conflict',
    message: 'Version conflict: expected 2, current 5',
  });
});

void test('resolveNodeDeleteLookup returns already_deleted for delete races', () => {
  const outcome = resolveNodeDeleteLookup({
    lookupError: null,
    node: null,
  });

  assert.deepEqual(outcome, {
    kind: 'already_deleted',
  });
});
