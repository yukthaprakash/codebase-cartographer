import * as fs from 'fs/promises';
import * as path from 'path';

export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
export const IGNORED_DIRECTORIES = ['node_modules', '.git', '.vscode', 'out'];

export function isSourceFile(filePath: string): boolean {
  return SOURCE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

export function normalizeWorkspacePath(filePath: string, rootPath: string): string {
  const relative = path.relative(rootPath, filePath);
  return relative.split(path.sep).join('/');
}

export async function walkWorkspaceFiles(rootPath: string): Promise<string[]> {
  const filePaths: string[] = [];

  async function recurse(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.includes(entry.name)) {
          continue;
        }
        await recurse(entryPath);
      } else if (entry.isFile() && isSourceFile(entryPath)) {
        filePaths.push(entryPath);
      }
    }
  }

  await recurse(rootPath);
  return filePaths;
}

export async function resolveImportTarget(
  importerPath: string,
  importSource: string,
  rootPath: string,
): Promise<string | null> {
  if (!importSource.startsWith('.') && !importSource.startsWith('/')) {
    return null;
  }

  const basePath = path.resolve(path.dirname(importerPath), importSource);
  const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, `${basePath}.js`, `${basePath}.jsx`];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return normalizeWorkspacePath(candidate, rootPath);
    }
  }

  for (const ext of SOURCE_EXTENSIONS) {
    const indexCandidate = path.join(basePath, `index${ext}`);
    if (await fileExists(indexCandidate)) {
      return normalizeWorkspacePath(indexCandidate, rootPath);
    }
  }

  return null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}
