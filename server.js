import { join, normalize } from "node:path";

const DIST_DIR = join(import.meta.dir, "dist");
const HEALTH_BODY = "ok\n";

function escapeJsString(input) {
  return String(input).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function normalizeBaseUrl(input) {
  const trimmed = String(input ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function isForbiddenHost(hostname) {
  const host = hostname.trim().toLowerCase();
  if (!host) {
    return true;
  }

  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    return true;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const octets = host.split(".").map((value) => Number(value));
    const [a, b] = octets;
    if (
      a === 10 ||
      a === 127 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254)
    ) {
      return true;
    }
  }

  return false;
}

function validateUrlForProxy(urlString, label) {
  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    throw new Error(`${label} is not a valid URL.`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`${label} must use http or https.`);
  }

  if (isForbiddenHost(parsedUrl.hostname)) {
    throw new Error(`${label} points to a restricted host.`);
  }

  return parsedUrl;
}

function getRuntimeConfigScript() {
  const baseUrl = escapeJsString(process.env.TRMNL_BASE_URL ?? "");
  const macAddress = escapeJsString(process.env.TRMNL_MAC_ADDRESS ?? "");
  const apiKey = escapeJsString(process.env.TRMNL_API_KEY ?? "");

  return `window.__TRMNL_CONFIG__ = Object.freeze({
  TRMNL_BASE_URL: '${baseUrl}',
  TRMNL_MAC_ADDRESS: '${macAddress}',
  TRMNL_API_KEY: '${apiKey}',
});
`;
}

function resolveStaticPath(pathname) {
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(DIST_DIR, normalizedPath);
  if (!candidate.startsWith(DIST_DIR)) {
    return null;
  }
  return candidate;
}

async function handleImageProxy(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON body\n", { status: 400 });
  }

  const imageUrlInput =
    typeof payload?.imageUrl === "string" ? payload.imageUrl.trim() : "";
  const baseUrlInput =
    typeof payload?.baseUrl === "string" ? payload.baseUrl.trim() : "";

  if (!imageUrlInput) {
    return new Response("imageUrl is required\n", { status: 400 });
  }

  try {
    const imageUrl = validateUrlForProxy(imageUrlInput, "imageUrl");
    const baseUrl = normalizeBaseUrl(baseUrlInput || process.env.TRMNL_BASE_URL);
    if (!baseUrl) {
      return new Response("A valid baseUrl is required for proxying\n", {
        status: 400,
      });
    }

    const parsedBase = validateUrlForProxy(baseUrl, "baseUrl");
    if (imageUrl.origin !== parsedBase.origin) {
      return new Response("imageUrl origin must match baseUrl origin\n", {
        status: 400,
      });
    }

    const upstreamResponse = await fetch(imageUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!upstreamResponse.ok) {
      const upstreamText = await upstreamResponse.text();
      return new Response(
        `Image proxy request failed (${upstreamResponse.status} ${upstreamResponse.statusText})${upstreamText ? ` - ${upstreamText.slice(0, 300)}` : ""}\n`,
        { status: upstreamResponse.status || 502 }
      );
    }

    const contentType =
      upstreamResponse.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = upstreamResponse.headers.get("content-length");
    const headers = new Headers({ "Content-Type": contentType });
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown proxy validation error.";
    return new Response(`${message}\n`, { status: 400 });
  }
}

Bun.serve({
  port: Number(process.env.PORT || "80"),
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return new Response(HEALTH_BODY, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/runtime-config.js") {
      return new Response(getRuntimeConfigScript(), {
        status: 200,
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      });
    }

    if (url.pathname === "/__trmnl_proxy/image") {
      if (request.method !== "POST") {
        return new Response("Method not allowed\n", { status: 405 });
      }
      return handleImageProxy(request);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed\n", { status: 405 });
    }

    const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const staticPath = resolveStaticPath(requestPath);
    if (staticPath) {
      const staticFile = Bun.file(staticPath);
      if (await staticFile.exists()) {
        return new Response(staticFile);
      }
    }

    return new Response(Bun.file(join(DIST_DIR, "index.html")));
  },
});
