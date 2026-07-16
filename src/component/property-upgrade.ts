export interface PendingProperty {
  name: string;
  value: unknown;
}

/**
 * Collects property values set on a element instance before the custom element
 * is defined (i.e. before connection), so they can be re-applied after upgrade.
 */
export function collectPendingProperties(
  element: HTMLElement,
  propertyNames: string[]
): PendingProperty[] {
  const collected: PendingProperty[] = [];
  for (const name of propertyNames) {
    if (name in element) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collected.push({ name, value: (element as any)[name] });
    }
  }
  return collected;
}

/**
 * Re-applies collected pending properties to the element after upgrade.
 */
export function applyPendingProperties(element: HTMLElement, pending: PendingProperty[]): void {
  for (const { name, value } of pending) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any)[name] = value;
  }
}
