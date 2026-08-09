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

        if (!graph.nodes || graph.nodes.length === 0) {
          vscode.window.showInformationMessage('No TypeScript/JavaScript source files found in the workspace.');
          return;
        }

        // Warn for very large workspaces
        const LARGE_LIMIT = 500;
        if (graph.nodes.length > LARGE_LIMIT) {
          const choice = await vscode.window.showWarningMessage(
            `Large workspace detected (${graph.nodes.length} files). Summarization may be slow or costly. Continue?`,
            { modal: true },
            'Continue',
            'Cancel',
          );
          if (choice !== 'Continue') {
            // Show graph with cached summaries only
            const cachedOnly = await summarizeWorkspaceFiles(rootPath, graph.nodes);
            createDependencyGraphWebview(context, graph, cachedOnly);
            return;
          }
        }

        // Determine API key: prefer setting, then env var
        const config = vscode.workspace.getConfiguration('cartographer');
        let apiKey = config.get<string>('openaiApiKey') || process.env.OPENAI_API_KEY;

        if (!apiKey) {
          const pick = await vscode.window.showInformationMessage(
            'OpenAI API key not found. Summaries require an API key. You can set it in Settings or continue without summaries.',
            'Set in Settings',
            'Enter now',
            'Continue without',
          );

          if (pick === 'Set in Settings') {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'cartographer.openaiApiKey');
          } else if (pick === 'Enter now') {
            const value = await vscode.window.showInputBox({
              prompt: 'Enter your OpenAI API key',
              placeHolder: 'sk-...',
              ignoreFocusOut: true,
              password: true,
            });
            if (value) {
              await config.update('openaiApiKey', value, vscode.ConfigurationTarget.Global);
              apiKey = value;
            }
          }
        }

        const summaries = await summarizeWorkspaceFiles(rootPath, graph.nodes, apiKey || undefined);
        createDependencyGraphWebview(context, graph, summaries);
      } catch (error) {
        const msg = (error as any)?.message || String(error);
        vscode.window.showErrorMessage(`Cartographer failed: ${msg}`);
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
