/**
 * Build an adjacency list from EDGES array.
 * EDGES format: [nodeA, nodeB, weight]
 */
function buildGraph(edges) {
  const graph = {};
  for (const [a, b, w] of edges) {
    if (!graph[a]) graph[a] = [];
    if (!graph[b]) graph[b] = [];
    graph[a].push([b, w]);
    graph[b].push([a, w]);
  }
  return graph;
}

/**
 * Dijkstra's shortest path between two nodes.
 * Returns array of nodeIds from startId to endId (inclusive), or [] if unreachable.
 */
export function shortestPath(startId, endId, edges) {
  if (startId === endId) return [startId];

  const graph = buildGraph(edges);
  const dist = {};
  const prev = {};
  const visited = new Set();

  // Simple priority queue using a sorted array
  const queue = [[0, startId]];
  dist[startId] = 0;

  while (queue.length > 0) {
    // Pop minimum distance node
    queue.sort((a, b) => a[0] - b[0]);
    const [d, u] = queue.shift();

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === endId) break;

    for (const [v, w] of (graph[u] || [])) {
      if (visited.has(v)) continue;
      const newDist = d + w;
      if (dist[v] === undefined || newDist < dist[v]) {
        dist[v] = newDist;
        prev[v] = u;
        queue.push([newDist, v]);
      }
    }
  }

  if (dist[endId] === undefined) return [];

  // Reconstruct path
  const path = [];
  let cur = endId;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return path;
}

/**
 * Compute full route paths between consecutive stops.
 * Returns array of paths, one per consecutive pair of stops.
 * Each path is an array of nodeIds.
 */
export function getRoutePaths(routeIds, edges) {
  const paths = [];
  for (let i = 0; i < routeIds.length - 1; i++) {
    const path = shortestPath(routeIds[i], routeIds[i + 1], edges);
    paths.push(path.length > 0 ? path : [routeIds[i], routeIds[i + 1]]);
  }
  return paths;
}
