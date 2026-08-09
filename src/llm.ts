import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { GraphNode } from './types';
import { normalizeWorkspacePath } from './utils';

interface SummaryCacheEntry {
  hash: string;
  summary: string;
  updatedAt: string;
}

type SummaryCache = Record<string, SummaryCacheEntry>;

const CACHE_FILENAME = '.cartographer-cache.json';
const BATCH_SIZE = 5;
const MODEL = 'gpt-3.5-turbo';

export async function summarizeWorkspaceFiles(
  rootPath: string,
  nodes: GraphNode[],
): Promise<Record<string, string>> {
  const cache = await loadCache(rootPath);
  const summaries: Record<string, string> = {};
  const pending: Array<{ node: GraphNode; content: string; hash: string }> = [];

  for (const node of nodes) {
    const normalizedPath = normalizeWorkspacePath(node.path, rootPath);
    const content = await fs.readFile(node.path, 'utf8');
    const hash = computeHash(content);
    const cached = cache[normalizedPath];

    if (cached && cached.hash === hash) {
      summaries[normalizedPath] = cached.summary;
    } else {
      pending.push({ node, content, hash });
    }
  }

  for (let index = 0; index < pending.length; index += BATCH_SIZE) {
    const batch = pending.slice(index, index + BATCH_SIZE);
    const batchSummaries = await requestSummaries(rootPath, batch);

    for (const item of batch) {
      const summary = batchSummaries[item.node.id] || 'No summary available.';
      summaries[item.node.id] = summary;
      cache[item.node.id] = {
        hash: item.hash,
        summary,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  await saveCache(rootPath, cache);
  return summaries;
}

async function loadCache(rootPath: string): Promise<SummaryCache> {
  const cachePath = path.join(rootPath, CACHE_FILENAME);
  try {
    const text = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(text) as SummaryCache;
  } catch {
    return {};
  }
}

async function saveCache(rootPath: string, cache: SummaryCache): Promise<void> {
  const cachePath = path.join(rootPath, CACHE_FILENAME);
  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to summarize files.');
  }
  return new OpenAI({ apiKey });
}

async function requestSummaries(
  rootPath: string,
  batch: Array<{ node: GraphNode; content: string; hash: string }>,
): Promise<Record<string, string>> {
  const client = getClient();
  const formattedFiles = batch
    .map(
      (item) =>
        `FILE_PATH: ${item.node.id}\nCONTENT_START\n${item.content}\nCONTENT_END`,
    )
    .join('\n\n');

  const prompt = `You are a code summarization assistant. For each file below, write a concise 1-2 sentence summary of the purpose of the file. Return only valid JSON with file path keys and summary values.

${formattedFiles}

Respond only with JSON, for example:\n{\n  "/src/foo.ts": "A helper module for ...",\n  "/src/bar.ts": "Defines ..."\n}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You summarize code files in one or two sentences.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  const text = response.choices?.[0]?.message?.content?.trim() ?? '';
  try {
    const parsed = JSON.parse(text) as Record<string, string>;
    return parsed;
  } catch {
    return parseFallback(text, batch.map((item) => item.node.id));
  }
}

function parseFallback(output: string, fileIds: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const fileId of fileIds) {
    const regex = new RegExp(`${escapeRegExp(fileId)}\s*[:\-]\s*"([^"]+)"`, 'i');
    const match = output.match(regex);
    if (match) {
      map[fileId] = match[1].trim();
    }
  }
  return map;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\\\]\\]/g, '\\$&');
}
