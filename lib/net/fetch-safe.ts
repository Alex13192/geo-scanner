// lib/net/fetch-safe.ts
//
// The one place the app is allowed to make an outbound request.
//
// Both API routes take a hostname from the query string and fetch it. That makes
// them an open fetch proxy, and three things followed from it: a hostname that
// resolves into the private network could be probed, a redirect could walk the
// fetch anywhere at all, and a response of any size would be read into memory.
// Everything below exists to close those three, and it is deliberately in one
// module so there is exactly one code path to audit.

export type SafeFetchResult = {
  status: number;
  body: string;
  lastModified: string | null;
  finalUrl: string;
  /** True when the response exceeded the read cap and was truncated. */
  truncated: boolean;
};

/** Generous next to the 500 KB the payload check calls good, and finite. */
const MAX_BYTES = 2 * 1024 * 1024;

/** Redirect hops we are willing to follow, each one re-validated. */
const MAX_REDIRECTS = 3;

/** Hostnames that point into a network rather than at a website. */
const BLOCKED_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".intranet",
  ".home.arpa",
  ".test",
  ".invalid",
  ".example",
];

/**
 * Services that resolve any hostname to an IP embedded in that hostname, so
 * 127.0.0.1.nip.io is a working alias for localhost. They have no legitimate
 * place in a public scanner.
 */
const WILDCARD_DNS = [
  /(^|\.)nip\.io$/i,
  /(^|\.)sslip\.io$/i,
  /(^|\.)xip\.io$/i,
  /(^|\.)traefik\.me$/i,
  /(^|\.)localtest\.me$/i,
  /(^|\.)lvh\.me$/i,
  /(^|\.)vcap\.me$/i,
];

function isIpLiteral(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  // Any colon means IPv6, including the v4-mapped forms that hide a private
  // IPv4 address inside one.
  return host.includes(":");
}

/**
 * Throws with a reason a caller can show a user. Nothing here resolves DNS:
 * an edge worker cannot, and the fetch itself is what refuses private targets.
 * These checks reject what can be rejected from the string alone.
 */
export function assertFetchableUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That is not a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http and https addresses can be scanned.");
  }

  const host = url.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");

  if (!host.includes(".")) {
    throw new Error("Enter a domain name, for example example.com.");
  }
  if (isIpLiteral(host)) {
    throw new Error("IP addresses are not scanned. Enter a domain name instead.");
  }
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new Error("That hostname points at a private network and will not be fetched.");
  }
  if (WILDCARD_DNS.some((re) => re.test(host))) {
    throw new Error("That hostname resolves to an address embedded in the name and will not be fetched.");
  }

  return url;
}

/** Non-throwing wrapper for callers that want to show the reason. */
export function inspectTarget(
  raw: string
): { ok: true; url: URL } | { ok: false; reason: string } {
  try {
    return { ok: true, url: assertFetchableUrl(raw) };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/**
 * Read at most `max` bytes.
 *
 * `res.text()` reads whatever arrives. A response of a few hundred megabytes is
 * then a way to exhaust a worker's memory from the outside, so the stream is
 * consumed in chunks and cancelled once the cap is reached.
 */
async function readCapped(res: Response, max: number): Promise<{ body: string; truncated: boolean }> {
  if (!res.body) {
    const text = await res.text();
    return text.length > max
      ? { body: text.slice(0, max), truncated: true }
      : { body: text, truncated: false };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let out = "";
  let truncated = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      out += decoder.decode(value, { stream: true });
      if (received >= max) {
        truncated = true;
        await reader.cancel();
        break;
      }
    }
  } catch {
    // A broken stream is still worth scoring on whatever arrived.
  }

  out += decoder.decode();
  return { body: out, truncated };
}

export type FetchOptions = {
  userAgent: string;
  accept?: string;
  acceptLanguage?: string;
  timeoutMs?: number;
};

/**
 * Fetch a URL that has passed the guard, following at most MAX_REDIRECTS
 * redirects and validating every hop with the same guard. Returns null when the
 * target is rejected or unreachable, so callers treat both as "no response" and
 * a rejected hostname is caught by inspectTarget before this is reached.
 */
export async function fetchText(
  rawUrl: string,
  options: FetchOptions
): Promise<SafeFetchResult | null> {
  const timeoutMs = options.timeoutMs ?? 9000;

  let current: URL;
  try {
    current = assertFetchableUrl(rawUrl);
  } catch {
    return null;
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(current.toString(), {
        headers: {
          "User-Agent": options.userAgent,
          Accept: options.accept ?? "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
          ...(options.acceptLanguage ? { "Accept-Language": options.acceptLanguage } : {}),
        },
        // Manual, so a redirect cannot be used to reach an address the guard
        // would have refused.
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });
    } catch {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        return { status: res.status, body: "", lastModified: null, finalUrl: current.toString(), truncated: false };
      }
      try {
        current = assertFetchableUrl(new URL(location, current).toString());
      } catch {
        return null;
      }
      continue;
    }

    const { body, truncated } = await readCapped(res, MAX_BYTES);
    return {
      status: res.status,
      body,
      lastModified: res.headers.get("last-modified"),
      finalUrl: current.toString(),
      truncated,
    };
  }

  // Too many redirects.
  return null;
}
