export function logger(type: 'warn' | 'error', message: string, detail?: unknown): void {
  const prefix = '[architecture-flow]';
  if (type === 'error') {
    console.error(`${prefix} ${message}`, detail ?? '');
  } else {
    console.warn(`${prefix} ${message}`, detail ?? '');
  }
}
