import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { signSpeed } from './signing.js';

export interface AttestationRequest {
  speed: number;
}

export interface AttestationResponse {
  signature: {
    announcement: { x: string; y: string };
    response: string;
  };
  message: {
    speed: string;
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

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
  return createHttpServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    const url = req.url ?? '/';

    if (req.method === 'GET' && url === '/health') {
      const response: HealthResponse = { status: 'ok', providerId };
      sendJson(res, 200, response);
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
      sendJson(res, 200, response);
      return;
    }

    if (req.method === 'POST' && url === '/attest') {
      try {
        const body = (await readJsonBody(req)) as AttestationRequest;
        if (body.speed == null) {
          sendJson(res, 400, { error: 'Missing required field: speed' });
          return;
        }

        const signature = signSpeed(providerSk, body.speed);
        const response: AttestationResponse = {
          signature: {
            announcement: {
              x: signature.announcement.x.toString(),
              y: signature.announcement.y.toString(),
            },
            response: signature.response.toString(),
          },
          message: {
            speed: body.speed.toString(),
          },
        };
        sendJson(res, 200, response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Attestation failed';
        sendJson(res, 500, { error: message });
      }
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });
}

export { readJsonBody, sendJson };
