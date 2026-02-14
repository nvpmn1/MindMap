export type NodeUpdateOutcome =
  | { kind: 'updated' }
  | { kind: 'conflict'; message: string }
  | { kind: 'not_found' };

export function resolveNodeUpdateOutcome(params: {
  updatedNode: unknown;
  expectedVersion?: number;
  currentNode: { version?: number | null } | null;
}): NodeUpdateOutcome {
  if (params.updatedNode) {
    return { kind: 'updated' };
  }

  if (typeof params.expectedVersion === 'number' && params.currentNode) {
    return {
      kind: 'conflict',
      message: `Version conflict: expected ${params.expectedVersion}, current ${params.currentNode.version}`,
    };
  }

  return { kind: 'not_found' };
}

export type NodeDeleteLookupOutcome =
  | { kind: 'proceed' }
  | { kind: 'already_deleted' }
  | { kind: 'error'; message: string };

export function resolveNodeDeleteLookup(params: {
  lookupError: { message?: string } | null;
  node: unknown;
}): NodeDeleteLookupOutcome {
  if (params.lookupError) {
    return {
      kind: 'error',
      message: params.lookupError.message || 'Failed to lookup node before delete',
    };
  }

  if (!params.node) {
    return { kind: 'already_deleted' };
  }

  return { kind: 'proceed' };
}
