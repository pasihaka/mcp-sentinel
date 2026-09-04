import { describe, it, expect } from 'vitest';
import {
  generateMagicToken,
  verifyMagicToken,
  generateSessionToken,
  verifySessionToken,
  timingSafeEqual,
} from '../src/auth/magic-link.js';
import {
  verifyStripeWebhookSignature,
  handleStripeWebhookEvent,
} from '../src/billing/stripe.js';
import { TIER_LIMITS } from '../src/edge/worker.js';

describe('Phase 2: Auth & Billing Engine', () => {
  const TEST_AUTH_SECRET = 'test-secret-key-32-characters-long!';
  const TEST_STRIPE_SECRET = 'whsec_test_stripe_secret_key_12345';

  describe('Magic Link Authentication', () => {
    it('should generate and verify a valid magic link token', async () => {
      const email = 'Developer@Example.com ';
      const token = await generateMagicToken(email, TEST_AUTH_SECRET);

      expect(token).toContain('.');
      const result = await verifyMagicToken(token, TEST_AUTH_SECRET);
      expect(result).not.toBeNull();
      expect(result?.email).toBe('developer@example.com'); // normalized
    });

    it('should reject a forged magic link token with altered signature', async () => {
      const token = await generateMagicToken('user@test.com', TEST_AUTH_SECRET);
      const [payload, signature] = token.split('.');
      const forgedToken = `${payload}.${signature}tampered`;

      const result = await verifyMagicToken(forgedToken, TEST_AUTH_SECRET);
      expect(result).toBeNull();
    });

    it('should reject an expired magic link token', async () => {
      // Generate token that expired 10 seconds ago
      const expiredToken = await generateMagicToken('user@test.com', TEST_AUTH_SECRET, -10);
      const result = await verifyMagicToken(expiredToken, TEST_AUTH_SECRET);
      expect(result).toBeNull();
    });

    it('should reject malformed tokens cleanly', async () => {
      expect(await verifyMagicToken('', TEST_AUTH_SECRET)).toBeNull();
      expect(await verifyMagicToken('not-a-token', TEST_AUTH_SECRET)).toBeNull();
      expect(await verifyMagicToken('a.b.c', TEST_AUTH_SECRET)).toBeNull();
    });
  });

  describe('Session Token Management', () => {
    it('should issue and verify long-lived session tokens', async () => {
      const user = {
        userId: 'usr_abc123',
        email: 'pro-user@domain.com',
        tier: 'pro' as const,
      };

      const sessionToken = await generateSessionToken(user, TEST_AUTH_SECRET, 30);
      const session = await verifySessionToken(sessionToken, TEST_AUTH_SECRET);

      expect(session).not.toBeNull();
      expect(session?.userId).toBe('usr_abc123');
      expect(session?.email).toBe('pro-user@domain.com');
      expect(session?.tier).toBe('pro');
    });

    it('should reject session tokens signed with a different secret', async () => {
      const user = { userId: '1', email: 'test@test.com', tier: 'free' as const };
      const token = await generateSessionToken(user, 'secret-one-at-least-32-chars-long!');
      const session = await verifySessionToken(token, 'secret-two-at-least-32-chars-long!');

      expect(session).toBeNull();
    });
  });

  describe('Zero-SDK Stripe Webhook Signature Verification', () => {
    // Helper to synthesize a legitimate Stripe signature
    async function createSyntheticStripeHeader(payload: string, secret: string, timestamp?: number): Promise<string> {
      const t = timestamp || Math.floor(Date.now() / 1000);
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signedData = `${t}.${payload}`;
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(signedData));
      const hexSig = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return `t=${t},v1=${hexSig}`;
    }

    it('should verify a cryptographically valid Stripe webhook payload', async () => {
      const rawBody = JSON.stringify({ id: 'evt_123', type: 'checkout.session.completed' });
      const signatureHeader = await createSyntheticStripeHeader(rawBody, TEST_STRIPE_SECRET);

      const verification = await verifyStripeWebhookSignature(rawBody, signatureHeader, TEST_STRIPE_SECRET);
      expect(verification.isValid).toBe(true);
      expect(verification.error).toBeUndefined();
    });

    it('should reject a Stripe payload with tampered body', async () => {
      const rawBody = JSON.stringify({ id: 'evt_123', amount: 1900 });
      const signatureHeader = await createSyntheticStripeHeader(rawBody, TEST_STRIPE_SECRET);

      const tamperedBody = JSON.stringify({ id: 'evt_123', amount: 0 }); // attacker altered body
      const verification = await verifyStripeWebhookSignature(tamperedBody, signatureHeader, TEST_STRIPE_SECRET);
      expect(verification.isValid).toBe(false);
      expect(verification.error).toBe('Signature mismatch.');
    });

    it('should reject a Stripe payload with expired timestamp (>300s old)', async () => {
      const rawBody = JSON.stringify({ id: 'evt_123' });
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const signatureHeader = await createSyntheticStripeHeader(rawBody, TEST_STRIPE_SECRET, oldTimestamp);

      const verification = await verifyStripeWebhookSignature(rawBody, signatureHeader, TEST_STRIPE_SECRET);
      expect(verification.isValid).toBe(false);
      expect(verification.error).toContain('tolerance window');
    });
  });

  describe('Stripe Event Lifecycle Simulation', () => {
    it('should process checkout.session.completed and upgrade user to pro tier', async () => {
      let updatedTier = '';
      let updatedCustomerId = '';

      // Mock D1 Database interface
      const mockDb = {
        prepare: (query: string) => ({
          bind: (...args: any[]) => ({
            run: async () => {
              updatedTier = args[0];
              updatedCustomerId = args[1];
              return { success: true };
            },
          }),
        }),
      };

      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_stripe_123',
            subscription: 'sub_stripe_abc',
            client_reference_id: 'usr_789',
            amount_total: 1900,
          },
        },
      };

      const result = await handleStripeWebhookEvent(event, mockDb);
      expect(result.handled).toBe(true);
      expect(result.tier).toBe('pro');
      expect(updatedTier).toBe('pro');
      expect(updatedCustomerId).toBe('cus_stripe_123');
    });

    it('should process customer.subscription.deleted and downgrade user to free tier', async () => {
      let downgradedTier = '';

      const mockDb = {
        prepare: (query: string) => ({
          bind: (...args: any[]) => ({
            run: async () => {
              downgradedTier = args[0];
              return { success: true };
            },
          }),
        }),
      };

      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_stripe_123',
          },
        },
      };

      const result = await handleStripeWebhookEvent(event, mockDb);
      expect(result.handled).toBe(true);
      expect(result.tier).toBe('free');
      expect(downgradedTier).toBe('free');
    });
  });

  describe('Tier Quota Rules', () => {
    it('should enforce strict tier boundaries', () => {
      expect(TIER_LIMITS.free.maxMonitors).toBe(1);
      expect(TIER_LIMITS.free.minIntervalSeconds).toBe(1800);
      expect(TIER_LIMITS.free.hasAlerts).toBe(false);

      expect(TIER_LIMITS.pro.maxMonitors).toBe(5);
      expect(TIER_LIMITS.pro.minIntervalSeconds).toBe(60);
      expect(TIER_LIMITS.pro.hasAlerts).toBe(true);

      expect(TIER_LIMITS.team.maxMonitors).toBe(20);
      expect(TIER_LIMITS.team.hasSecretScan).toBe(true);
    });
  });
});
