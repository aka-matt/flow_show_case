import { ServiceNode } from './ServiceNode.js';
import { DatabaseNode } from './DatabaseNode.js';
import { QueueNode } from './QueueNode.js';
import { ClientNode } from './ClientNode.js';
import { GroupNode } from './GroupNode.js';
import { GenericNode } from './GenericNode.js';

export const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  queue: QueueNode,
  client: ClientNode,
  group: GroupNode,
  generic: GenericNode,
};
