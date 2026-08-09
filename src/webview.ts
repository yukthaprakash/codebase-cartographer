import * as vscode from 'vscode';
import * as path from 'path';
import { FileGraph } from './types';

export function createDependencyGraphWebview(
  context: vscode.ExtensionContext,
  graph: FileGraph,
  summaries: Record<string, string>,
): void {
  const panel = vscode.window.createWebviewPanel(
    'cartographerGraph',
    'AI Codebase Cartographer',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
    },
  );

  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'webview.js')),
  );
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'webview.css')),
  );
  const d3Uri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, 'media', 'd3.min.js')),
  );

  const graphPayload = JSON.stringify({ graph, summaries }).replace(/</g, '\u003c');

  panel.webview.html = getWebviewContent(scriptUri.toString(), styleUri.toString(), d3Uri.toString(), graphPayload);

  panel.webview.onDidReceiveMessage((message) => {
    if (message.type === 'openFile') {
      const fileUri = vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', message.path));
      vscode.window.showTextDocument(fileUri);
    }
  });
}

function getWebviewContent(scriptUri: string, styleUri: string, d3Uri: string, payload: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>AI Codebase Cartographer</title>
</head>
<body>
  <div id="graph-container"></div>
  <div id="preview-panel" class="hidden">
    <div id="preview-header">File Summary</div>
    <div id="preview-content"></div>
  </div>

  <script src="${d3Uri}"></script>
  <script>
    const payload = ${payload};
  </script>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}
