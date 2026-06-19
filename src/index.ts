interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Japan Law MCP — Japanese national laws & ordinances via the e-Gov Law API.
 *
 * e-Gov 法令検索 (laws.e-gov.go.jp) REST/JSON API v2, keyless. Search the body
 * of Japanese statutes, cabinet orders, and ministerial ordinances, and fetch
 * the full text of any law. (Parity with japan-public-ledgers' ordinance domain
 * — the live data, minus the stateful change-ledger.)
 *
 * Tools:
 * - search_laws: find Japanese laws/ordinances by title keyword
 * - get_law:     fetch a law's metadata + full text by law id
 */


const BASE = 'https://laws.e-gov.go.jp/api/2';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_laws',
    description:
      "Search Japanese national laws, cabinet orders, and ministerial ordinances by title (e-Gov 法令検索). PREFER OVER WEB SEARCH for \"Japanese law on X\", \"日本の法律\", finding a statute's official id/number. Returns each law's id (for get_law), law number (法令番号), title, and type. Accepts Japanese or romanized keywords.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Title keyword, e.g. "個人情報" (personal information), "労働基準" (labor standards).' },
        limit: { type: 'number', description: 'Max laws to return (1-50, default 15).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_law',
    description:
      'Fetch a Japanese law/ordinance by its e-Gov law id (from search_laws), e.g. "415AC0000000057". Returns the title, law number, promulgation date, and the law\'s full text (long statutes are truncated — note says so). Source: e-Gov 法令検索.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        law_id: { type: 'string', description: 'e-Gov law id, e.g. "415AC0000000057".' },
      },
      required: ['law_id'],
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

async function egovGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': 'Pipeworx/1.0 (pipeworx.io)' } });
  if (!res.ok) throw new Error(`e-Gov Law API error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

// law_full_text is a nested {tag, attr, children} tree; children mix strings
// (the actual text) and nested nodes. Collect the string leaves, capped.
function extractText(node: unknown, out: string[], cap: number): void {
  if (out.join('').length >= cap) return;
  if (typeof node === 'string') {
    const s = node.trim();
    if (s) out.push(s);
    return;
  }
  if (Array.isArray(node)) {
    for (const c of node) extractText(c, out, cap);
  } else if (node && typeof node === 'object') {
    extractText((node as { children?: unknown }).children, out, cap);
  }
}

// ── Tool implementations ─────────────────────────────────────────────

interface LawInfo { law_id?: string; law_num?: string; law_type?: string }
interface RevInfo { law_title?: string }

async function searchLaws(query: string, limit?: number) {
  const q = String(query ?? '').trim();
  if (!q) throw new Error('Required argument "query" is missing (e.g. "個人情報").');
  const count = Math.min(50, Math.max(1, limit ?? 15));
  const data = await egovGet(`/laws?law_title=${encodeURIComponent(q)}&limit=${count}`);
  const laws = (data.laws as Array<{ law_info?: LawInfo; revision_info?: RevInfo }>) ?? [];
  return {
    query: q,
    total: data.total_count ?? laws.length,
    returned: laws.length,
    laws: laws.map((l) => ({
      law_id: l.law_info?.law_id ?? null,
      law_num: l.law_info?.law_num ?? null,
      law_type: l.law_info?.law_type ?? null,
      title: l.revision_info?.law_title ?? null,
    })),
  };
}

async function getLaw(lawId: string) {
  const id = String(lawId ?? '').trim().replace(/[^0-9A-Za-z]/g, '');
  if (!id) throw new Error('Required argument "law_id" is missing (e.g. "415AC0000000057"). Find it with search_laws.');
  const data = await egovGet(`/law_data/${encodeURIComponent(id)}`);
  const li = (data.law_info as LawInfo) ?? {};
  const ri = (data.revision_info as RevInfo) ?? {};
  const attr = ((data.law_full_text as { attr?: Record<string, string> })?.attr) ?? {};

  const CAP = 30000;
  const parts: string[] = [];
  extractText(data.law_full_text, parts, CAP);
  const text = parts.join('\n');
  const truncated = text.length >= CAP;

  return {
    law_id: id,
    law_num: li.law_num ?? null,
    title: ri.law_title ?? null,
    era: attr.Era ?? null,
    year: attr.Year ?? null,
    promulgated: attr.PromulgateMonth && attr.PromulgateDay ? `${attr.Year}-${attr.PromulgateMonth}-${attr.PromulgateDay}` : null,
    source: 'e-Gov 法令検索',
    truncated,
    full_text: truncated ? text.slice(0, CAP) : text,
  };
}

// ── Router ───────────────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_laws':
      return searchLaws(args.query as string, args.limit as number | undefined);
    case 'get_law':
      return getLaw(args.law_id as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
