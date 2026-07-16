export const EVENT_FLOW_READY = 'flow-ready';
export const EVENT_FLOW_LOADING = 'flow-loading';
export const EVENT_FLOW_LOADED = 'flow-loaded';
export const EVENT_FLOW_ERROR = 'flow-error';
export const EVENT_NODE_CLICK = 'node-click';
export const EVENT_NODE_DOUBLE_CLICK = 'node-double-click';
export const EVENT_EDGE_CLICK = 'edge-click';
export const EVENT_SELECTION_CHANGE = 'selection-change';
export const EVENT_VIEWPORT_CHANGE = 'viewport-change';
export const EVENT_DATA_CHANGE = 'data-change';
export const EVENT_THEME_CHANGE = 'theme-change';

export interface FlowReadyDetail {
  instance: unknown;
  data: unknown;
}

export interface FlowErrorDetail {
  code: string;
  message: string;
  error?: Error;
}

export function emitCustomEvent<T>(
  target: HTMLElement,
  name: string,
  detail: T,
  options?: Partial<CustomEventInit<T>>,
): void {
  target.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      ...options,
    }),
  );
}
