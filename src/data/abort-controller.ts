export interface AbortControllerRef {
  signal: AbortSignal;
  abort: () => void;
}

let counter = 0;

export function createAbortController(): AbortControllerRef {
  const id = ++counter;
  let aborted = false;
  let controller: AbortController | null = new AbortController();

  return {
    get signal() {
      return controller!.signal;
    },
    abort() {
      if (aborted) return;
      aborted = true;
      controller?.abort();
      controller = null;
    },
  };
}
