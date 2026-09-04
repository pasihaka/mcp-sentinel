import { timingSafeEqual } from '../auth/magic-link.js';

export interface StripeWebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Computes HMAC-SHA256 hex string using standard Web Crypto API
 */
async function computeHmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cryptographically verifies Stripe's `Stripe-Signature` header without external dependencies.
 */
export async function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSeconds = 300
): Promise<StripeWebhookVerificationResult> {
  if (!signatureHeader || !webhookSecret) {
    return { isValid: false, error: 'Missing signature header or webhook secret.' };
  }

  const items = signatureHeader.split(',').map(item => item.trim());
  let timestamp = '';
  const signatures: string[] = [];

  for (const item of items) {
    const [key, value] = item.split('=');
    if (key === 't' && value) {
      timestamp = value;
    } else if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return { isValid: false, error: 'Malformed Stripe-Signature header.' };
  }

  // Check timestamp tolerance
  const eventTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(eventTime) || Math.abs(now - eventTime) > toleranceSeconds) {
    return { isValid: false, error: `Signature timestamp out of tolerance window (${toleranceSeconds}s).` };
  }

  // Compute expected HMAC-SHA256
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = await computeHmacSha256Hex(webhookSecret, signedPayload);

  // Check against all provided v1 signatures using constant-time comparison
  const matched = signatures.some(sig => timingSafeEqual(sig, expectedSignature));

  if (!matched) {
    return { isValid: false, error: 'Signature mismatch.' };
  }

  return { isValid: true };
}

/**
 * Processes incoming Stripe events and updates user subscription tiers in Cloudflare D1
 */
export async function handleStripeWebhookEvent(
  event: any,
  db: any // D1Database
): Promise<{ handled: boolean; eventType: string; userId?: string; tier?: string }> {
  const eventType: string = event.type;
  const now = Date.now();

  if (eventType === 'checkout.session.completed') {
    const session = event.data.object;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const clientRefId = session.client_reference_id;
    const customerEmail = session.customer_email || session.customer_details?.email;

    // Determine tier from metadata or amount
    let tier: 'pro' | 'team' = 'pro';
    if (session.metadata?.tier === 'team' || session.amount_total >= 4000) {
      tier = 'team';
    }

    if (clientRefId) {
      await db
        .prepare(
          `UPDATE users 
           SET tier = ?, stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(tier, customerId, subscriptionId, now, clientRefId)
        .run();
      return { handled: true, eventType, userId: clientRefId, tier };
    } else if (customerEmail) {
      await db
        .prepare(
          `UPDATE users 
           SET tier = ?, stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ?
           WHERE email = ?`
        )
        .bind(tier, customerId, subscriptionId, now, customerEmail.toLowerCase())
        .run();
      return { handled: true, eventType, tier };
    }
  }

  if (eventType === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    if (customerId) {
      await db
        .prepare(
          `UPDATE users 
           SET tier = ?, stripe_subscription_id = NULL, updated_at = ?
           WHERE stripe_customer_id = ?`
        )
        .bind('free', now, customerId)
        .run();
      return { handled: true, eventType, tier: 'free' };
    }
  }

  if (eventType === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const status = subscription.status;

    if (status === 'past_due' || status === 'unpaid' || status === 'canceled') {
      await db
        .prepare(
          `UPDATE users 
           SET tier = ?, updated_at = ?
           WHERE stripe_customer_id = ?`
        )
        .bind('free', now, customerId)
        .run();
      return { handled: true, eventType, tier: 'free' };
    }
  }

  return { handled: false, eventType };
}

/**
 * Creates a self-serve Stripe Billing Customer Portal Session via direct Stripe REST API
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
  stripeSecretKey: string
): Promise<string> {
  const params = new URLSearchParams();
  params.append('customer', customerId);
  params.append('return_url', returnUrl);

  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Stripe Portal Error [${response.status}]: ${errBody}`);
  }

  const data: any = await response.json();
  return data.url;
}
