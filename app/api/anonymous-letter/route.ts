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

function getClientIp(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unavailable";
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
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "پیام بیش از حد بزرگ است." }, { status: 413 });
  }

  const raw = await request.text();
  if (raw.length > MAX_REQUEST_BYTES) {
    return json({ error: "پیام بیش از حد بزرگ است." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "درخواست معتبر نیست." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ error: "متن یادداشت باید بین ۱ تا ۱۵۰۰ نویسه باشد." }, { status: 400 });
  }

  if (parsed.data.website.trim()) {
    return json({ ok: true });
  }

  const secret = env.ANONYMOUS_LETTER_HMAC_SECRET;
  if (!secret || !env.DB) {
    return json({ error: "امکان دریافت پیام موقتاً در دسترس نیست." }, { status: 503 });
  }

  try {
    const ipHash = await hmacIp(getClientIp(request), secret);
    const userAgent = request.headers.get("user-agent") ?? "";
    const db = getDb();
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
        { error: "چند یادداشت پشت سر هم فرستاده شده. کمی بعد دوباره امتحان کن." },
        { status: 429, headers: { "retry-after": "600" } },
      );
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
  } catch {
    return json({ error: "پیام فرستاده نشد. دوباره امتحان کن." }, { status: 500 });
  }
}
