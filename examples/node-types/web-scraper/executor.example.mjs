/**
 * Simple webpage fetcher — uses native fetch (Node 18+), no extra dependencies.
 * node.type: "webpage" (ArcPX) — folder named web-scraper for clarity.
 */

const DEFAULT_USER_AGENT = "arc-dag-web-scraper/1.0 (+https://github.com/arcpx-eng/arc-dag)";

/**
 * @param {string} html
 */
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].replace(/\s+/g, " ").trim()) : null;
}

/**
 * @param {string} html
 */
function htmlToText(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/ +/g, " ").trim();
}

/**
 * @param {string} s
 */
function decodeEntities(s) {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * @param {string} url
 */
function assertHttpUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`webpage: invalid URL "${url}"`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`webpage: only http/https URLs allowed, got ${parsed.protocol}`);
  }
  return parsed.href;
}

export function createWebpageHandler() {
  return async function webpageNode(node) {
    const data = node.data ?? {};
    const config = data.nodeData;
    if (!config || typeof config !== "object") {
      throw new Error("webpage: data.nodeData object required with { url }");
    }

    const url = assertHttpUrl(String(config.url ?? "").trim());
    const timeoutMs = Number(config.timeoutMs ?? 15_000);
    const maxChars = Number(config.maxChars ?? 50_000);
    const userAgent = String(config.userAgent ?? process.env.WEB_SCRAPER_USER_AGENT ?? DEFAULT_USER_AGENT);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": userAgent,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();

    if (!res.ok) {
      throw new Error(`webpage: HTTP ${res.status} for ${url}`);
    }

    const isHtml = /html|xml/i.test(contentType) || /<html/i.test(raw.slice(0, 500));
    const text = isHtml ? htmlToText(raw) : raw;
    const truncated = text.length > maxChars;

    /** @type {Record<string, unknown>} */
    const payload = {
      label: data.label ?? null,
      url,
      finalUrl: res.url,
      status: res.status,
      contentType,
      title: isHtml ? extractTitle(raw) : null,
      text: truncated ? text.slice(0, maxChars) : text,
      truncated,
      length: text.length,
    };

    if (data.outputTarget) {
      const target = String(data.outputTarget);
      payload.outputTarget = target;
      payload.cells = { [target]: { ...payload } };
    }

    return payload;
  };
}

/** Alias for custom node.type names */
export const createWebScraperHandler = createWebpageHandler;
