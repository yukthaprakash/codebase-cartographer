import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from '@babel/parser';
import { FileGraph, GraphEdge, GraphNode } from './types';
import { walkWorkspaceFiles, resolveImportTarget, normalizeWorkspacePath } from './utils';

const PARSER_PLUGINS = [
  'typescript',
  'jsx',
  'classProperties',
  'decorators-legacy',
  'dynamicImport',
  'nullishCoalescingOperator',
  'optionalChaining',
];

export async function scanWorkspace(rootPath: string): Promise<FileGraph> {
  const files = await walkWorkspaceFiles(rootPath);
  const nodes: GraphNode[] = files.map((filePath) => ({
    id: normalizeWorkspacePath(filePath, rootPath),
    label: path.basename(filePath),
    path: filePath,
  }));
  const edges: GraphEdge[] = [];
  const fileSet = new Set(nodes.map((node) => node.id));

  for (const filePath of files) {
    const relativeId = normalizeWorkspacePath(filePath, rootPath);
    const code = await fs.readFile(filePath, 'utf8');
    const imports = extractImports(code, filePath);

    for (const importSource of imports) {
      const resolved = await resolveImportTarget(filePath, importSource, rootPath);
      if (resolved && fileSet.has(resolved)) {
        edges.push({ source: relativeId, target: resolved });
      }
    }
  }

  return { nodes, edges };
}

function extractImports(code: string, filePath: string): string[] {
  try {
    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: PARSER_PLUGINS as any,
    });

    const imports: string[] = [];
    walkAst(ast, (node: any) => {
      if (node.type === 'ImportDeclaration' && node.source && node.source.value) {
        imports.push(String(node.source.value));
      }
      if (node.type === 'ExportAllDeclaration' && node.source && node.source.value) {
        imports.push(String(node.source.value));
      }
      if (node.type === 'ExportNamedDeclaration' && node.source && node.source.value) {
        imports.push(String(node.source.value));
      }
      if (node.type === 'CallExpression' && node.callee) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'StringLiteral'
        ) {
          imports.push(String(node.arguments[0].value));
        }
      }
      if (node.type === 'ImportExpression' && node.source && node.source.type === 'StringLiteral') {
        imports.push(String(node.source.value));
      }
    });

    return Array.from(new Set(imports));
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, (error as Error).message);
    return [];
  }
}

function walkAst(node: any, callback: (node: any) => void): void {
  if (!node || typeof node !== 'object') {
    return;
  }

  callback(node);

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        walkAst(child, callback);
      }
    } else if (typeof value === 'object' && value !== null) {
      walkAst(value, callback);
    }
  }
}
