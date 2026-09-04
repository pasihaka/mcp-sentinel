/**
 * Edge-Native Magic Link and Session Token Utilities using standard Web Crypto API.
 * Zero external dependencies. Runs seamlessly on Cloudflare Workers and Node.js.
 */

export interface MagicTokenPayload {
  email: string;
  exp: number; // Unix epoch timestamp (ms)
}

export interface SessionTokenPayload {
  userId: string;
  email: string;
  tier: 'free' | 'pro' | 'team';
  exp: number; // Unix epoch timestamp (ms)
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Performs timing-safe equality check to prevent timing side-channel attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Computes HMAC-SHA256 signature in Base64URL format
 */
async function signMessage(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const sigBytes = Array.from(new Uint8Array(signature));
  const binary = String.fromCharCode(...sigBytes);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a short-lived URL-safe Magic Link token (default 15 minutes)
 */
export async function generateMagicToken(
  email: string,
  secret: string,
  expiresInSeconds = 900
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const exp = Date.now() + expiresInSeconds * 1000;
  const payloadJson = JSON.stringify({ email: normalizedEmail, exp });
  const payloadB64 = base64UrlEncode(payloadJson);
  const signature = await signMessage(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

/**
 * Validates a Magic Link token. Returns email if valid and not expired, null otherwise.
 */
export async function verifyMagicToken(
  token: string,
  secret: string
): Promise<{ email: string } | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, providedSignature] = parts;
  if (!payloadB64 || !providedSignature) return null;

  const expectedSignature = await signMessage(payloadB64, secret);
  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return null; // Invalid signature / forgery attempt
  }

  try {
    const payloadJson = base64UrlDecode(payloadB64);
    const payload: MagicTokenPayload = JSON.parse(payloadJson);

    if (!payload.email || typeof payload.exp !== 'number') {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return { email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Generates a signed Session Token (default 30 days)
 */
export async function generateSessionToken(
  user: { userId: string; email: string; tier: 'free' | 'pro' | 'team' },
  secret: string,
  expiresInDays = 30
): Promise<string> {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const payload: SessionTokenPayload = {
    userId: user.userId,
    email: user.email.trim().toLowerCase(),
    tier: user.tier,
    exp,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = await signMessage(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a Session Token and returns the authenticated user context
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, providedSignature] = parts;
  if (!payloadB64 || !providedSignature) return null;

  const expectedSignature = await signMessage(payloadB64, secret);
  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(payloadB64);
    const payload: SessionTokenPayload = JSON.parse(payloadJson);

    if (!payload.userId || !payload.email || !payload.tier || typeof payload.exp !== 'number') {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
