import * as vscode from 'vscode';
import { scanWorkspace } from './scanner';
import { summarizeWorkspaceFiles } from './llm';
import { createDependencyGraphWebview } from './webview';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cartographer.generateMap', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('Please open a workspace before generating the dependency map.');
      return;
    }

    const rootPath = workspaceFolder.uri.fsPath;
    const progressOptions: vscode.ProgressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: 'Cartographer: generating dependency map',
      cancellable: false,
    };

    await vscode.window.withProgress(progressOptions, async () => {
      try {
        const graph = await scanWorkspace(rootPath);
        const summaries = await summarizeWorkspaceFiles(rootPath, graph.nodes);
        createDependencyGraphWebview(context, graph, summaries);
      } catch (error) {
        vscode.window.showErrorMessage(`Cartographer failed: ${(error as Error).message}`);
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
