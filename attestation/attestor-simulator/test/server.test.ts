import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { Server } from 'node:http';
import * as crypto from 'crypto';
import { createServer } from '../src/server.js';
import { generateKeyPair, computeDriverBinding } from '../src/signing.js';

setNetworkId('undeployed');

describe('Attestor simulator server', () => {
  let server: Server;
  let baseUrl: string;
  const { sk, pk } = generateKeyPair();
  const providerId = 42;
  const driverSecret = new Uint8Array(crypto.randomBytes(32));
  const driverBinding = computeDriverBinding(driverSecret).toString();

  beforeAll(async () => {
    server = createServer(sk, providerId, pk);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'string' ? addr : addr?.port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET /health returns ok status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.providerId).toBe(providerId);
  });

  it('GET /provider-info returns provider public key', async () => {
    const res = await fetch(`${baseUrl}/provider-info`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.providerId).toBe(providerId);
    expect(body.publicKey.x).toBe(pk.x.toString());
    expect(body.publicKey.y).toBe(pk.y.toString());
  });

  it('POST /attest with tripId safe returns speed 67 attestation bound to driverBinding', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: 'safe', driverBinding }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signature).toBeDefined();
    expect(body.signature.announcement.x).toBeDefined();
    expect(body.message.tripId).toBe('safe');
    expect(body.message.speed).toBe('67');
    expect(body.message.driverBinding).toBe(driverBinding);
    expect(body.message.attestationId).toBeDefined();
    expect(body.message.attestationId.length).toBeGreaterThan(0);
  });

  it('POST /attest with tripId unsafe returns speed 112 attestation', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: 'unsafe', driverBinding }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message.tripId).toBe('unsafe');
    expect(body.message.speed).toBe('112');
  });

  it('POST /attest ignores client-supplied speed', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: 'safe', driverBinding, speed: 999 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message.speed).toBe('67');
  });

  it('POST /attest returns 400 for missing tripId', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverBinding }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing required field');
  });

  it('POST /attest returns 400 for missing driverBinding', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: 'safe' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('driverBinding');
  });

  it('POST /attest returns 400 for unknown tripId', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: 'tampered', driverBinding }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unknown tripId');
  });
});
