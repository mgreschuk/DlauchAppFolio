import type { AppFolioAdapter } from "./adapter";
import type { AppFolioApiConfig, AppFolioUnit, AppFolioWorkOrder } from "./types";
import { RateLimiter } from "./rate-limiter";

/**
 * AppFolio REST API implementation of the AppFolioAdapter interface.
 *
 * All public methods route through the rate limiter (5 req/15s per ENGINE-01).
 * Business logic must only reference AppFolioAdapter — never this class directly.
 *
 * Base URL: https://api.appfolio.com (per project memory, NOT api.qa.appfolio.com)
 */
export class AppFolioApiClient implements AppFolioAdapter {
  private rateLimiter: RateLimiter;
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: AppFolioApiConfig) {
    this.rateLimiter = new RateLimiter(5, 15_000);
    this.baseUrl = `${config.baseUrl}/${config.databaseId}`;
    // AppFolio uses client_id:client_secret as Basic auth
    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString("base64");
    this.headers = {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };
  }

  async getUnits(propertyId?: string): Promise<AppFolioUnit[]> {
    return this.rateLimiter.execute(async () => {
      const url = new URL(`${this.baseUrl}/api/v1/units.json`);
      if (propertyId) url.searchParams.set("property_id", propertyId);
      const res = await fetch(url.toString(), { headers: this.headers });
      if (!res.ok) {
        throw new Error(`AppFolio API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return this.mapUnits(data);
    });
  }

  async checkWorkOrderExists(unitId: string, category: string): Promise<boolean> {
    return this.rateLimiter.execute(async () => {
      const url = new URL(`${this.baseUrl}/api/v1/tasks.json`);
      url.searchParams.set("unit_id", unitId);
      url.searchParams.set("category", category);
      url.searchParams.set("status", "open");
      const res = await fetch(url.toString(), { headers: this.headers });
      if (!res.ok) {
        throw new Error(`AppFolio API error: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) && data.length > 0;
    });
  }

  async createWorkOrder(params: {
    unitId: string;
    category: string;
    vendorId: string;
    description: string;
  }): Promise<AppFolioWorkOrder> {
    return this.rateLimiter.execute(async () => {
      const res = await fetch(`${this.baseUrl}/api/v1/tasks.json`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          task: {
            unit_id: params.unitId,
            category: params.category,
            vendor_id: params.vendorId,
            description: params.description,
          },
        }),
      });
      if (!res.ok) {
        throw new Error(`AppFolio API error: ${res.status}`);
      }
      const data = await res.json();
      return this.mapWorkOrder(data);
    });
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      return await this.rateLimiter.execute(async () => {
        const res = await fetch(
          `${this.baseUrl}/api/v1/units.json?per_page=1`,
          { headers: this.headers }
        );
        if (res.ok) return { connected: true };
        return {
          connected: false,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      });
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private mapUnits(data: unknown): AppFolioUnit[] {
    if (!Array.isArray(data)) return [];
    return data.map((u: Record<string, unknown>) => ({
      id: String(u["id"] ?? ""),
      propertyId: String(u["property_id"] ?? ""),
      unitName: String(u["name"] ?? u["unit_name"] ?? ""),
      address: String(u["address"] ?? ""),
      status: String(u["status"] ?? ""),
    }));
  }

  private mapWorkOrder(data: Record<string, unknown>): AppFolioWorkOrder {
    return {
      id: String(data["id"] ?? ""),
      unitId: String(data["unit_id"] ?? ""),
      category: String(data["category"] ?? ""),
      vendorId: String(data["vendor_id"] ?? ""),
      vendorName: String(data["vendor_name"] ?? ""),
      description: String(data["description"] ?? ""),
      status: String(data["status"] ?? ""),
      createdAt: String(data["created_at"] ?? ""),
    };
  }
}
