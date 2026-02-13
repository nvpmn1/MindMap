import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeMessageContentForAnthropic,
  sanitizeMessageSequenceForAnthropic,
  type NormalizedAnthropicMessage,
} from './toolProtocol';

test('drops orphan tool_result blocks when no matching previous tool_use exists', () => {
  const messages: NormalizedAnthropicMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'tool_orphan', content: '{"ok":true}' },
        { type: 'text', text: 'recrie esse mapa' },
      ],
    },
  ];

  const result = sanitizeMessageSequenceForAnthropic(messages);

  assert.equal(result.droppedToolResults, 1);
  assert.equal(result.messages.length, 1);
  assert.ok(Array.isArray(result.messages[0].content));
  assert.deepEqual(result.messages[0].content, [{ type: 'text', text: 'recrie esse mapa' }]);
});

test('keeps tool_result blocks when previous assistant message has matching tool_use', () => {
  const messages: NormalizedAnthropicMessage[] = [
    {
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'tool_123', name: 'create_nodes', input: {} }],
    },
    {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'tool_123', content: '{"success":true}' }],
    },
  ];

  const result = sanitizeMessageSequenceForAnthropic(messages);

  assert.equal(result.droppedToolResults, 0);
  assert.equal(result.messages.length, 2);
  assert.deepEqual(result.messages[1].content, [
    { type: 'tool_result', tool_use_id: 'tool_123', content: '{"success":true}' },
  ]);
});

test('converts fully orphaned tool_result message into fallback text content', () => {
  const messages: NormalizedAnthropicMessage[] = [
    {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'tool_missing', content: '{"error":"x"}' }],
    },
  ];

  const result = sanitizeMessageSequenceForAnthropic(messages);

  assert.equal(result.droppedToolResults, 1);
  assert.equal(result.messages.length, 1);
  assert.equal(typeof result.messages[0].content, 'string');
  assert.equal(result.messages[0].content, '{"error":"x"}');
});

test('normalizes tool_result blocks using id as tool_use_id fallback', () => {
  const normalized = normalizeMessageContentForAnthropic([
    { type: 'tool_result', id: 'tool_abc', text: '{"success":true}' },
  ]);

  assert.ok(Array.isArray(normalized));
  assert.equal(normalized.length, 1);
  assert.deepEqual(normalized[0], {
    type: 'tool_result',
    tool_use_id: 'tool_abc',
    content: '{"success":true}',
  });
});

