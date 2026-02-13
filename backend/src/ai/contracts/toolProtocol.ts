export type NormalizedAnthropicMessage = {
  role: 'user' | 'assistant';
  content: string | Array<Record<string, unknown>>;
};

export function serializeMessageContent(content: string | Array<Record<string, unknown>>): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((block) => {
      if (!block || typeof block !== 'object') {
        return '';
      }

      if (typeof block.text === 'string') {
        return block.text;
      }

      if (typeof block.content === 'string') {
        return block.content;
      }

      try {
        return JSON.stringify(block);
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .join(' ');
}

function normalizeContentBlockForAnthropic(block: unknown): Record<string, unknown> | null {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return null;
  }

  const rawBlock = { ...(block as Record<string, unknown>) };
  const type = typeof rawBlock.type === 'string' ? rawBlock.type : 'text';

  if (type === 'text') {
    const text = serializeMessageContent([rawBlock]).trim();
    if (text.length === 0) {
      return null;
    }

    return { type: 'text', text };
  }

  if (type === 'tool_use') {
    const id = typeof rawBlock.id === 'string' ? rawBlock.id : undefined;
    const name = typeof rawBlock.name === 'string' ? rawBlock.name : undefined;
    const input =
      rawBlock.input && typeof rawBlock.input === 'object' && !Array.isArray(rawBlock.input)
        ? rawBlock.input
        : {};

    if (!id || !name) {
      return null;
    }

    return { type: 'tool_use', id, name, input };
  }

  if (type === 'tool_result') {
    const toolUseId =
      typeof rawBlock.tool_use_id === 'string'
        ? rawBlock.tool_use_id
        : typeof rawBlock.id === 'string'
          ? rawBlock.id
          : undefined;
    if (!toolUseId) {
      return null;
    }

    const textContent = serializeMessageContent([rawBlock]).trim();
    return {
      type: 'tool_result',
      tool_use_id: toolUseId,
      content:
        textContent.length > 0 ? textContent : '{"success":false,"error":"tool_result_empty"}',
      ...(rawBlock.is_error === true ? { is_error: true } : {}),
    };
  }

  if (type === 'image' || type === 'document') {
    return rawBlock;
  }

  const fallbackText = serializeMessageContent([rawBlock]).trim();
  if (fallbackText.length === 0) {
    return null;
  }

  return { type: 'text', text: fallbackText };
}

export function normalizeMessageContentForAnthropic(
  content: string | Array<Record<string, unknown>>
): string | Array<Record<string, unknown>> {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  const blocks = content
    .map((block) => normalizeContentBlockForAnthropic(block))
    .filter((block): block is Record<string, unknown> => !!block);

  if (blocks.length > 0) {
    return blocks;
  }

  return serializeMessageContent(content);
}

function getToolUseIds(content: string | Array<Record<string, unknown>>): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(content)) {
    return ids;
  }

  for (const block of content) {
    if (
      block &&
      typeof block === 'object' &&
      block.type === 'tool_use' &&
      typeof block.id === 'string'
    ) {
      ids.add(block.id);
    }
  }

  return ids;
}

export function sanitizeMessageSequenceForAnthropic(
  messages: NormalizedAnthropicMessage[]
): { messages: NormalizedAnthropicMessage[]; droppedToolResults: number } {
  const sanitized: NormalizedAnthropicMessage[] = [];
  let droppedToolResults = 0;

  for (const message of messages) {
    if (!Array.isArray(message.content)) {
      sanitized.push(message);
      continue;
    }

    const previousMessage = sanitized[sanitized.length - 1];
    const allowedToolUseIds =
      message.role === 'user' && previousMessage?.role === 'assistant'
        ? getToolUseIds(previousMessage.content)
        : new Set<string>();

    const filteredBlocks = message.content.filter((block) => {
      if (!block || typeof block !== 'object') {
        return false;
      }

      if (block.type !== 'tool_result') {
        return true;
      }

      const toolUseId =
        typeof block.tool_use_id === 'string'
          ? block.tool_use_id
          : typeof block.id === 'string'
            ? block.id
            : '';

      const isValidToolResult = toolUseId.length > 0 && allowedToolUseIds.has(toolUseId);
      if (!isValidToolResult) {
        droppedToolResults += 1;
      }
      return isValidToolResult;
    });

    if (filteredBlocks.length > 0) {
      sanitized.push({
        role: message.role,
        content: filteredBlocks,
      });
      continue;
    }

    const fallbackText = serializeMessageContent(message.content).trim();
    if (fallbackText.length > 0) {
      sanitized.push({
        role: message.role,
        content: fallbackText,
      });
    }
  }

  return { messages: sanitized, droppedToolResults };
}

