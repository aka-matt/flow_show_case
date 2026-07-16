import { ArchitectureFlowElement } from './component/ArchitectureFlowElement.js';

if (typeof customElements !== 'undefined' && !customElements.get('architecture-flow')) {
  customElements.define('architecture-flow', ArchitectureFlowElement);
}

export { ArchitectureFlowElement };
export { ArchitectureFlowElement as ArchitectureFlow };

declare global {
  interface HTMLElementTagNameMap {
    'architecture-flow': ArchitectureFlowElement;
  }
}
