import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { signTripAttestation, generateAttestationId } from './signing.js';
import { resolveDemoTripSpeed } from './trips.js';

export interface AttestationRequest {
  tripId: string;
  /** H("DRIVEPROOF_SUBJECT_V1", driverSecret) — driver sends binding, never the raw secret. */
  driverBinding: string;
}

export interface AttestationResponse {
  signature: {
    announcement: { x: string; y: string };
    response: string;
  };
  message: {
    tripId: string;
    speed: string;
    driverBinding: string;
    attestationId: string;
  };
}

export interface ProviderInfoResponse {
  providerId: number;
  publicKey: { x: string; y: string };
}

export interface HealthResponse {
  status: string;
  providerId: number;
}

export const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:5173';

function configuredAllowedOrigin(): string | undefined {
  return process.env.ATTTESTOR_ALLOWED_ORIGIN?.trim() || undefined;
}

/** Resolve one exact browser origin. Invalid or wildcard configuration fails closed. */
export function resolveAllowedOrigin(value: string | undefined = configuredAllowedOrigin()): string | undefined {
  const candidate = value?.trim() || DEFAULT_ALLOWED_ORIGIN;
  if (candidate === '*') {
    return undefined;
  }

  try {
    const origin = new URL(candidate);
    if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
      return undefined;
    }
    return origin.origin;
  } catch {
    return undefined;
  }
}

export function isAllowedOrigin(requestOrigin: string | undefined, allowedOrigin: string | undefined): boolean {
  return requestOrigin === undefined || (allowedOrigin !== undefined && requestOrigin === allowedOrigin);
}

function corsHeaders(requestOrigin: string | undefined, allowedOrigin: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  if (requestOrigin !== undefined && requestOrigin === allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  }
  return headers;
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  requestOrigin?: string,
  allowedOrigin?: string,
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...corsHeaders(requestOrigin, allowedOrigin),
  });
  res.end(payload);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createServer(providerSk: bigint, providerId: number, providerPk: JubjubPoint) {
  const allowedOrigin = resolveAllowedOrigin();

  return createHttpServer(async (req, res) => {
    const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

    if (!isAllowedOrigin(requestOrigin, allowedOrigin)) {
      sendJson(res, 403, { error: 'Browser origin is not allowed' }, requestOrigin, allowedOrigin);
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...corsHeaders(requestOrigin, allowedOrigin),
      });
      res.end();
      return;
    }

    const url = req.url ?? '/';

    if (req.method === 'GET' && url === '/health') {
      const response: HealthResponse = { status: 'ok', providerId };
      sendJson(res, 200, response, requestOrigin, allowedOrigin);
      return;
    }

    if (req.method === 'GET' && url === '/provider-info') {
      const response: ProviderInfoResponse = {
        providerId,
        publicKey: {
          x: providerPk.x.toString(),
          y: providerPk.y.toString(),
        },
      };
      sendJson(res, 200, response, requestOrigin, allowedOrigin);
      return;
    }

    if (req.method === 'POST' && url === '/attest') {
      try {
        const body = (await readJsonBody(req)) as AttestationRequest;
        if (!body.tripId) {
          sendJson(res, 400, { error: 'Missing required field: tripId' }, requestOrigin, allowedOrigin);
          return;
        }
        if (body.driverBinding == null || body.driverBinding === '') {
          sendJson(res, 400, { error: 'Missing required field: driverBinding' }, requestOrigin, allowedOrigin);
          return;
        }

        const speed = resolveDemoTripSpeed(body.tripId);
        if (speed === undefined) {
          sendJson(res, 400, { error: 'Unknown tripId — use "safe" or "unsafe"' }, requestOrigin, allowedOrigin);
          return;
        }

        const driverBinding = BigInt(body.driverBinding);
        const attestationId = generateAttestationId();
        const signature = signTripAttestation(providerSk, speed, driverBinding, attestationId);
        const response: AttestationResponse = {
          signature: {
            announcement: {
              x: signature.announcement.x.toString(),
              y: signature.announcement.y.toString(),
            },
            response: signature.response.toString(),
          },
          message: {
            tripId: body.tripId,
            speed: speed.toString(),
            driverBinding: driverBinding.toString(),
            attestationId: attestationId.toString(),
          },
        };
        sendJson(res, 200, response, requestOrigin, allowedOrigin);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Attestation failed';
        sendJson(res, 500, { error: message }, requestOrigin, allowedOrigin);
      }
      return;
    }

    sendJson(res, 404, { error: 'Not found' }, requestOrigin, allowedOrigin);
  });
}

export { readJsonBody, sendJson };
