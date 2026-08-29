import { describe, expect, it } from "vitest";
import { checkAttestorHealth } from "./index";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("checkAttestorHealth", () => {
  it("reports the issuer as ready from a successful health response", async () => {
    const requests: string[] = [];
    const status = await checkAttestorHealth("http://localhost:4000/", async (input) => {
      requests.push(String(input));
      return jsonResponse({ status: "ok", providerId: 1 });
    });

    expect(status).toEqual({ status: "ready", url: "http://localhost:4000", providerId: 1 });
    expect(requests).toEqual(["http://localhost:4000/health"]);
  });

  it("reports an unavailable issuer without throwing on an HTTP failure", async () => {
    const status = await checkAttestorHealth("http://localhost:4000", async () => jsonResponse({}, 503));

    expect(status).toEqual({
      status: "unavailable",
      url: "http://localhost:4000",
      message: "Attestor /health returned HTTP 503."
    });
  });

  it("reports a network failure as unavailable", async () => {
    const status = await checkAttestorHealth("http://localhost:4000", async () => {
      throw new Error("connection refused");
    });

    expect(status).toEqual({
      status: "unavailable",
      url: "http://localhost:4000",
      message: "Attestor is unavailable at http://localhost:4000: connection refused"
    });
  });
});
