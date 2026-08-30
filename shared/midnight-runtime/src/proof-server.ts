import { DEFAULT_PROOF_SERVER_URL } from "@driveproof/midnight-wallet";

export const EXPECTED_PROOF_SERVER_VERSION = "8.1.0";

export type ProofServerStatus =
  | { status: "reachable"; url: string; version: string }
  | { status: "unavailable"; url: string; message: string }
  | { status: "incompatible"; url: string; version?: string; expectedVersion: string; message: string };

function normalizedUrl(url: string): string {
  return new URL(url).toString().replace(/\/$/, "");
}

function versionEndpoint(url: string): string {
  return `${normalizedUrl(url)}/version`;
}

export function parseProofServerVersion(body: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object" && "version" in parsed) {
      const version = (parsed as { version?: unknown }).version;
      if (typeof version === "string") return version;
    }
  } catch {
    // The proof server may return a plain-text version. Continue to the text parser.
  }

  return body.match(/\b\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\b/)?.[0];
}

export async function checkProofServer(options: {
  url?: string;
  expectedVersion?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
} = {}): Promise<ProofServerStatus> {
  const configuredUrl = options.url ?? DEFAULT_PROOF_SERVER_URL;
  let url: string;
  try {
    url = normalizedUrl(configuredUrl);
  } catch {
    return {
      status: "unavailable",
      url: configuredUrl,
      message: `Proof server URL is invalid: ${configuredUrl}`
    };
  }
  const expectedVersion = options.expectedVersion ?? EXPECTED_PROOF_SERVER_VERSION;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 5_000
  );

  try {
    const response = await fetchImpl(versionEndpoint(url), { signal: controller.signal });
    if (!response.ok) {
      return {
        status: "unavailable",
        url,
        message: `Proof server returned HTTP ${response.status} from /version.`
      };
    }

    const body = await response.text();
    const version = parseProofServerVersion(body);
    if (!version || version !== expectedVersion) {
      return {
        status: "incompatible",
        url,
        version,
        expectedVersion,
        message: version
          ? `Proof server version ${version} is incompatible; expected ${expectedVersion}.`
          : `Proof server did not return a readable version; expected ${expectedVersion}.`
      };
    }

    return { status: "reachable", url, version };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "unavailable",
      url,
      message: `Proof server is unavailable at ${url}: ${message}`
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
