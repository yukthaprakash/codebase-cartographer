<div align="center">

# 🗺️ AI Codebase Cartographer

**Understand an unfamiliar codebase in minutes, not hours.**

A VS Code extension that scans your workspace, maps file-level dependencies, explains every file in plain English with an LLM, and renders it all as an interactive graph.

![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visualstudiocode&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3dotjs&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

![Demo](media/demo.gif)

</div>

---

## Why this exists

Joining a new project usually means clicking through dozens of files asking, *"what does this do, and who depends on it?"*

Cartographer answers both questions visually. Run one command and see the whole structure of your project. Hover any file for a short AI summary, and click it to jump straight into the code.

## Features

- **Interactive dependency graph**: a D3 force-directed map with zoom, pan and drag.
- **AI file summaries**: a 1–2 sentence explanation per file, shown on hover.
- **Click to open**: click any node to open that file in the editor.
- **Robust import detection**: real AST parsing with `@babel/parser`, not regex. It handles `import`, `export … from`, dynamic `import()` and `require()`.
- **Cost-aware LLM usage**: files are summarized in batches and results are cached in `.cartographer-cache.json`, so re-runs are fast and cheap.
- **Works without an API key**: you still get the full graph. Only the summaries are skipped.
- **Supported files**: `.ts`, `.tsx`, `.js`, `.jsx`

![Dependency graph](media/graph.png)

## Install

### Option 1: From a release (fastest)

1. Download the latest `.vsix` from [Releases](https://github.com/yukthaprakash/codebase-cartographer/releases).
2. In VS Code, open **Extensions** → **⋯** menu → **Install from VSIX…** and select the file.

Or from a terminal:

```bash
code --install-extension ai-codebase-cartographer-0.0.1.vsix
```

### Option 2: From source

```bash
git clone https://github.com/yukthaprakash/codebase-cartographer.git
cd codebase-cartographer
npm install
npm run compile
```

Open the folder in VS Code and press **F5** to launch the Extension Development Host.

## Usage

1. Open a JavaScript or TypeScript project in VS Code. In development mode, open it in the **new** Extension Development Host window.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run **Cartographer: Generate Dependency Map**.
4. Explore the graph:
   - **Scroll** to zoom and **drag** the background to pan.
   - **Hover** a node to read its summary.
   - **Click** a node to open the file.

### Enabling AI summaries

Summaries use the OpenAI API. Provide your key in either way:

```bash
# macOS / Linux
export OPENAI_API_KEY="sk-..."

# Windows PowerShell
$env:OPENAI_API_KEY="sk-..."
```

Launch VS Code from that same terminal (`code .`) so it can see the variable. The extension can also prompt for your key on first run. Without a key, the graph still renders and only the summaries are skipped.

> **Never commit your API key.** Add `.cartographer-cache.json` to your `.gitignore` too.

## How it works

![Architecture](media/architecture.png)

| Stage | File | What it does |
|---|---|---|
| **Command** | `src/extension.ts` | Registers `cartographer.generateMap` and coordinates the pipeline. |
| **Scan** | `src/scanner.ts`, `src/utils.ts`, `src/types.ts` | Walks the workspace, parses each file into an AST, resolves imports and builds a `{ nodes, edges }` graph. |
| **Summarize** | `src/llm.ts` | Batches file contents, calls OpenAI and caches results on disk. |
| **Render** | `src/webview.ts`, `media/webview.js` | Sends the graph to a Webview where D3 draws it. The Webview posts `open-file` messages back to the extension host. |

## Tech stack

TypeScript · Node.js · VS Code Extension API · `@babel/parser` · OpenAI SDK · D3.js

## Privacy & cost

- **Your code leaves your machine.** File contents are sent to OpenAI to generate summaries. Don't run this on private or regulated code unless your organization allows it. Without an API key, nothing is sent anywhere.
- **Large workspaces cost more.** Batching and caching keep usage down, but a big repo can still hit rate limits. Try a small project first.

## Limitations

- JavaScript and TypeScript only for now.
- Graph edges show file relationships, not individual function calls.
- Summaries depend on the LLM and can be wrong. Treat them as a starting point.

## Roadmap

- [ ] Arrowheads to show import direction
- [ ] Highlight "hub" files that many others depend on
- [ ] Search and filter nodes
- [ ] Python and Java support
- [ ] Local models (Ollama) for fully offline summaries
- [ ] Publish to the VS Code Marketplace

## Development

```bash
npm run compile    # build
npm run package    # build the .vsix (requires vsce)
```

| | |
|---|---|
| Command ID | `cartographer.generateMap` |
| Command title | Cartographer: Generate Dependency Map |

## What I learned

- **LLM tools need batching and caching.** These are what keep cost and latency under control.
- **Webviews need care.** Assets must load securely, and messages between the extension host and the frontend must be handled carefully.
- **AST parsing beats regex.** Dynamic imports and `require()` calls are easy to miss with text matching.

## Contributing

Issues and pull requests are welcome. If you try it on your own project, I'd love to hear how it went.

## License

MIT. See [LICENSE](LICENSE).

---

<div align="center">

Built by [Yuktha Prakash](https://github.com/yukthaprakash). If this helped you, a ⭐ means a lot.

</div>
