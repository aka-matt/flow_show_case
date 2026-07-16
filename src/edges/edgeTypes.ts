import { ArchitectureEdge } from './ArchitectureEdge.js';

export { ArchitectureEdge as default } from './ArchitectureEdge.js';

export const edgeTypes = {
  smoothstep: ArchitectureEdge,
  default: ArchitectureEdge,
  straight: ArchitectureEdge,
  step: ArchitectureEdge,
  bezier: ArchitectureEdge,
};
