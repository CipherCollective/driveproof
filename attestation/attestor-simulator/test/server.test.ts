import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { computeDriverBinding, generateDriverSecret } from 'driveproof-contract';
import type { Server } from 'node:http';
import { createServer } from '../src/server.js';
import { generateKeyPair } from '../src/signing.js';

setNetworkId('undeployed');

describe('Attestor simulator server', () => {
  let server: Server;
  let baseUrl: string;
  const { sk, pk } = generateKeyPair();
  const providerId = 42;
  const driverSecret = generateDriverSecret();
  const driverBinding = computeDriverBinding(driverSecret);

  function attestBody(tripId: string, extra: Record<string, unknown> = {}) {
    return JSON.stringify({ tripId, driverBinding: driverBinding.toString(), ...extra });
  }

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

  it('allows the local Driver browser origin', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('rejects a disallowed browser origin without wildcard access', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://not-driveproof.example' },
    });
    expect(res.status).toBe(403);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('POST /attest with tripId safe returns 16-sample attestation', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: attestBody('safe'),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signature).toBeDefined();
    expect(body.signature.announcement.x).toBeDefined();
    expect(body.message.tripId).toBe('safe');
    expect(body.message.driverBinding).toBe(driverBinding.toString());
    expect(body.message.attestationId).toBeDefined();
    expect(body.message.salt).toBeDefined();
    expect(body.message.tripCommitment).toBeDefined();
    expect(body.message.samples).toHaveLength(16);
    expect(Math.max(...body.message.samples.map((sample: { speed: string }) => Number(sample.speed)))).toBe(67);
  });

  it('POST /attest with tripId unsafe returns max speed 112 attestation', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: attestBody('unsafe'),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message.tripId).toBe('unsafe');
    expect(body.message.samples).toHaveLength(16);
    expect(Math.max(...body.message.samples.map((sample: { speed: string }) => Number(sample.speed)))).toBe(112);
  });

  it('POST /attest ignores client-supplied samples', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: attestBody('safe', {
        samples: [{ gridX: 0, gridY: 0, speed: 999, braking: 0, timeBucket: 1 }],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Math.max(...body.message.samples.map((sample: { speed: string }) => Number(sample.speed)))).toBe(67);
  });

  it('POST /attest returns 400 for missing tripId', async () => {
    const res = await fetch(`${baseUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
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
      body: attestBody('tampered'),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unknown tripId');
  });
});
