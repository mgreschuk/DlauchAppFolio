import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AppFolioApiClient } from "../api-client";
import type { AppFolioAdapter } from "../adapter";

const mockConfig = {
  baseUrl: "https://api.appfolio.com",
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  databaseId: "test-db",
};

describe("AppFolioApiClient", () => {
  it("implements the AppFolioAdapter interface (type check)", () => {
    const client = new AppFolioApiClient(mockConfig);
    // Type-level assertion: if this compiles, the interface is implemented
    const adapter: AppFolioAdapter = client;
    expect(typeof adapter.getUnits).toBe("function");
    expect(typeof adapter.checkWorkOrderExists).toBe("function");
    expect(typeof adapter.createWorkOrder).toBe("function");
    expect(typeof adapter.testConnection).toBe("function");
  });

  describe("testConnection()", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns { connected: true } on HTTP 200", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 })
      );

      const client = new AppFolioApiClient(mockConfig);
      const result = await client.testConnection();

      expect(result).toEqual({ connected: true });
    });

    it("returns { connected: false, error } on non-200 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
      );

      const client = new AppFolioApiClient(mockConfig);
      const result = await client.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toContain("401");
    });

    it("returns { connected: false, error } when fetch throws", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      const client = new AppFolioApiClient(mockConfig);
      const result = await client.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("sends Authorization header with Basic credentials", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 })
      );

      const client = new AppFolioApiClient(mockConfig);
      await client.testConnection();

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const headers = options?.headers as Record<string, string>;
      expect(headers["Authorization"]).toMatch(/^Basic /);
    });
  });
});
