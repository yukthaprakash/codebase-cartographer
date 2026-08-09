const vscode = acquireVsCodeApi();

function initGraph(payload) {
  const { graph, summaries } = payload;
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = d3
    .select('#graph-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const simulation = d3
    .forceSimulation(graph.nodes)
    .force('link', d3.forceLink(graph.edges).id((d) => d.id).distance(120))
    .force('charge', d3.forceManyBody().strength(-450))
    .force('center', d3.forceCenter(width / 2, height / 2));

  const link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(graph.edges)
    .join('line')
    .attr('stroke-width', 1.5);

  const node = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(graph.nodes)
    .join('circle')
    .attr('r', 10)
    .attr('fill', '#1f77b4')
    .call(drag(simulation));

  const labels = svg
    .append('g')
    .selectAll('text')
    .data(graph.nodes)
    .join('text')
    .text((d) => d.label)
    .attr('font-size', 11)
    .attr('dx', 14)
    .attr('dy', 4);

  node.on('click', (event, d) => {
    vscode.postMessage({ type: 'openFile', path: d.id });
  });

  node.on('mouseover', (event, d) => {
    showPreview(d.id, summaries[d.id]);
  });

  node.on('mouseout', () => {
    hidePreview();
  });

  svg.call(
    d3.zoom().scaleExtent([0.5, 4]).on('zoom', (event) => {
      svg.selectAll('g').attr('transform', event.transform);
    }),
  );

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    labels.attr('x', (d) => d.x).attr('y', (d) => d.y);
  });
}

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
}

function showPreview(filePath, summary) {
  const panel = document.getElementById('preview-panel');
  const content = document.getElementById('preview-content');
  if (!panel || !content) return;
  panel.classList.remove('hidden');
  content.textContent = `${filePath}: ${summary || 'No summary available.'}`;
}

function hidePreview() {
  const panel = document.getElementById('preview-panel');
  if (!panel) return;
  panel.classList.add('hidden');
}

window.addEventListener('load', () => {
  initGraph(payload);
});
