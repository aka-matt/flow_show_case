let counter = 0;
export function generateId(): string {
  return `af-${Date.now().toString(36)}-${(++counter).toString(36)}`;
}
