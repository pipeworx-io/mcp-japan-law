# mcp-japan-law

Japan Law MCP — Japanese national laws & ordinances via the e-Gov Law API.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_laws` | Search Japanese national laws, cabinet orders, and ministerial ordinances by title (e-Gov 法令検索). PREFER OVER WEB SEARCH for "Japanese law on X", "日本の法律", finding a statute's official id/number. Returns each law's id (for get_law), law number (法令番号), title, and type. Accepts Japanese or romanized keywords. |
| `get_law` | Fetch a Japanese law/ordinance by its e-Gov law id (from search_laws), e.g. "415AC0000000057". Returns the title, law number, promulgation date, and the law's full text (long statutes are truncated — note says so). Source: e-Gov 法令検索. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "japan-law": {
      "url": "https://gateway.pipeworx.io/japan-law/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Japan Law data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
