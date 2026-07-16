export interface AbortControllerRef {
  signal: AbortSignal;
  abort: () => void;
}

export function createAbortController(): AbortControllerRef {
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
