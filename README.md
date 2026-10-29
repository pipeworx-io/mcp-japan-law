# @pipeworx/japan-law

Japanese national laws, cabinet orders, and ministerial ordinances — title
search, a law's full text (paged), and a single article (including branch
articles like 第二十七条の2) at its current or a point-in-time version — from
e-Gov 法令検索, the Japanese government's official law portal.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

- `search_laws(query, limit?)` — TITLE search only: finds laws whose title
  matches a keyword ("個人情報", "労働基準"). Does not search the body text of a
  law. Returns each match's law id, law number, title and type.
- `japan_law_get_article(law_id, article, as_of?)` — the text of a single article, by
  law id (from `search_laws`) and article number. `article` accepts "27",
  "27条の2", "27-2", "27_2", or the kanji form "第二十七条の2" — all branch-article
  spellings resolve to the same lookup. Returns just that article's caption,
  heading and text — far cheaper than paging through `get_law` to find one
  provision. Pass `as_of` (YYYY-MM-DD) to get the article as it stood on that
  date, e.g. before or after a given amendment.
- `get_law(law_id, as_of?, offset?, limit?)` — a law's metadata plus its full
  text, PAGED by character offset: `has_more` / `next_offset` say whether
  another page follows; a long law is never silently cut off with no way to
  continue. Pass `as_of` for the version of the law in force on a given date.

Every response carries `source` (publisher + dataset) and, where the law
versions, `revision_date` (the actual effective date of the revision
returned) alongside the `as_of` the caller asked for.

## Auth

Keyless. e-Gov's law API is open to the public with no registration.

## Data source

e-Gov 法令検索 (Japan's e-Government law portal), the Japanese government's
official, keyless law search and text API — the same data Japan's courts,
ministries and legal publishers cite. Point-in-time (`as_of`) support follows
the portal's own revision history: each law carries every revision the portal
has recorded, and `as_of` resolves to the revision in force on that date.

## Coverage and what is not here

- Search is TITLE matching only. There is no full-text (body) search across
  the statute corpus — a query that only appears inside a law's articles, not
  its title, will not find that law.
- `japan_law_get_article` looks up the first article with a matching number in
  document order, which in every law checked during this build is the article
  in the main provisions (本則). A law whose supplementary provisions (附則)
  reuse the same article numbering is not specially disambiguated.
- Branch-article parsing covers the kanji numerals articles actually use
  (one to several thousand); it is not a general kanji-numeral parser for
  arbitrary magnitudes.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/japan-law/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/search_laws \
  -H 'Content-Type: application/json' \
  -d '{"query":"個人情報保護"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/search_laws`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-japan-law` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/japan-law/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "japan-law": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-japan-law"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Japan Law data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
