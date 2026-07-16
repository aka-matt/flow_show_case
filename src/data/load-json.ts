import type { ArchitectureDocument } from '../schema/architecture-document.js';
import { validateArchitectureDocument } from '../schema/zod-schema.js';

export interface LoadResult {
  source: 'src' | 'property' | 'inline';
  data: ArchitectureDocument;
}

export interface LoadError {
  code: string;
  message: string;
  error?: Error;
}

export async function fetchJson(
  url: string,
  signal: AbortSignal
): Promise<ArchitectureDocument> {
  const response = await fetch(url, {
    signal,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Try to parse; content-type check is lenient per spec
  let raw: unknown;
  try {
    raw = await response.json();
  } catch (err) {
    throw new Error('Invalid JSON response');
  }

  const validated = validateArchitectureDocument(raw);
  if (!validated.success) {
    const e = validated.error;
    throw new Error(e.path ? `${e.code}: ${e.message} at ${e.path}` : `${e.code}: ${e.message}`);
  }

  return validated.data;
}

export function parseInlineJson(text: string): ArchitectureDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Invalid inline JSON');
  }
  const validated = validateArchitectureDocument(raw);
  if (!validated.success) {
    const e = validated.error;
    throw new Error(e.path ? `${e.code}: ${e.message} at ${e.path}` : `${e.code}: ${e.message}`);
  }
  return validated.data;
}
