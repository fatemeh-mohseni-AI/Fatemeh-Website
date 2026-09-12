import { env } from "cloudflare:workers";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { anonymousMessages } from "@/db/schema";

const MAX_BODY_LENGTH = 1500;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_REQUEST_BYTES = 5000;

const requestSchema = z.object({
  body: z.string().trim().min(1).max(MAX_BODY_LENGTH),
  sourceRoute: z.string().trim().min(1).max(120).optional().default("unknown"),
  website: z.string().max(200).optional().default(""),
});

type DeviceType = "desktop" | "mobile" | "tablet" | "bot";

let storageReady: Promise<void> | null = null;
let ephemeralHmacSecret: string | null = null;
let warnedAboutEphemeralSecret = false;

function getClientIp(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

function getBrowserFamily(userAgent: string) {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/(OPR\/|Opera)/i.test(userAgent)) return "Opera";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/(CriOS\/|Chrome\/)/i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent) && !/(Chrome\/|Chromium\/|CriOS\/)/i.test(userAgent)) return "Safari";
  return "Other";
}

function getDeviceType(userAgent: string): DeviceType {
  if (/(bot|crawler|spider|slurp|bingpreview)/i.test(userAgent)) return "bot";
  if (/(iPad|Tablet|PlayBook|Silk)/i.test(userAgent)) return "tablet";
  if (/(Mobi|Android|iPhone|iPod)/i.test(userAgent)) return "mobile";
  return "desktop";
}

async function hmacIp(ip: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(ip));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getHmacSecret() {
  const configured = env.ANONYMOUS_LETTER_HMAC_SECRET?.trim();
  if (configured) return configured;

  // Do not make message delivery depend on an optional deployment secret.
  // The fallback is random per worker isolate, so raw IP addresses still never
  // reach storage. Configure the secret in production for durable rate limits.
  ephemeralHmacSecret ??= randomSecret();
  if (!warnedAboutEphemeralSecret) {
    warnedAboutEphemeralSecret = true;
    console.warn(
      "ANONYMOUS_LETTER_HMAC_SECRET is not configured; using an ephemeral in-memory key. Message delivery works, but rate limiting resets across worker isolates.",
    );
  }
  return ephemeralHmacSecret;
}

async function ensureStorageSchema() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding DB is unavailable.");
  }

  if (!storageReady) {
    storageReady = (async () => {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS anonymous_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          body TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          source_route TEXT NOT NULL,
          ip_hash TEXT NOT NULL,
          browser_family TEXT NOT NULL,
          device_type TEXT NOT NULL
        )
      `).run();

      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS anonymous_messages_ip_created_idx
        ON anonymous_messages (ip_hash, created_at)
      `).run();
    })().catch((error) => {
      storageReady = null;
      throw error;
    });
  }

  await storageReady;
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "درخواست معتبر نیست.", code: "invalid_content_type" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "پیام بیش از حد بزرگ است.", code: "request_too_large" }, { status: 413 });
  }

  const raw = await request.text();
  if (raw.length > MAX_REQUEST_BYTES) {
    return json({ error: "پیام بیش از حد بزرگ است.", code: "request_too_large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "درخواست معتبر نیست.", code: "invalid_json" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      { error: "متن یادداشت باید بین ۱ تا ۱۵۰۰ نویسه باشد.", code: "invalid_message" },
      { status: 400 },
    );
  }

  // Honeypot: pretend success so automated submissions do not learn the trap.
  if (parsed.data.website.trim()) {
    return json({ ok: true }, { status: 201 });
  }

  if (!env.DB) {
    return json(
      { error: "دیتابیس پیام‌ها در این محیط فعال نیست.", code: "database_unavailable" },
      { status: 503 },
    );
  }

  try {
    await ensureStorageSchema();

    const clientIp = getClientIp(request);
    const secret = getHmacSecret();
    const ipHash = clientIp ? await hmacIp(clientIp, secret) : "unavailable";
    const userAgent = request.headers.get("user-agent") ?? "";
    const db = getDb();

    // If an IP is not available (common in some local preview setups), do not
    // collapse every visitor into one shared rate-limit bucket.
    if (clientIp) {
      const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
      const [recent] = await db
        .select({ value: count() })
        .from(anonymousMessages)
        .where(
          and(
            eq(anonymousMessages.ipHash, ipHash),
            gte(anonymousMessages.createdAt, cutoff),
          ),
        );

      if (Number(recent?.value ?? 0) >= RATE_LIMIT_MAX) {
        return json(
          {
            error: "چند یادداشت پشت سر هم فرستاده شده. کمی بعد دوباره امتحان کن.",
            code: "rate_limited",
          },
          { status: 429, headers: { "retry-after": "600" } },
        );
      }
    }

    await db.insert(anonymousMessages).values({
      body: parsed.data.body,
      createdAt: Date.now(),
      sourceRoute: parsed.data.sourceRoute,
      ipHash,
      browserFamily: getBrowserFamily(userAgent),
      deviceType: getDeviceType(userAgent),
    });

    return json({ ok: true }, { status: 201 });
  } catch (error) {
    // Never log message contents or request headers. The error itself is enough
    // to diagnose binding/schema failures without leaking visitor data.
    console.error("Anonymous letter persistence failed", error);
    return json(
      { error: "پیام ذخیره نشد. دوباره امتحان کن.", code: "persistence_failed" },
      { status: 500 },
    );
  }
}
