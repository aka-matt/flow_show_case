// React Flow base CSS + component CSS — imported as inline strings for Shadow DOM injection
import reactFlowCss from '@xyflow/react/dist/style.css?inline';
import componentCss from '../theme/component.css?inline';

export const COMBINED_CSS = `${reactFlowCss}\n${componentCss}`;
