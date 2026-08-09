export interface GraphNode {
  id: string;
  label: string;
  path: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface FileGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
