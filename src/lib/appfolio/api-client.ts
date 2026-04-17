import type { AppFolioAdapter } from "./adapter";
import type { AppFolioApiConfig, AppFolioUnit, AppFolioVendor, AppFolioWorkOrder } from "./types";
import { RateLimiter } from "./rate-limiter";

/**
 * AppFolio REST API implementation of the AppFolioAdapter interface.
 *
 * All public methods route through the rate limiter (5 req/15s per ENGINE-01).
 * Business logic must only reference AppFolioAdapter — never this class directly.
 *
 * API v0: https://api.qa.appfolio.com/api/v0/{endpoint} (sandbox)
 *         https://api.appfolio.com/api/v0/{endpoint} (production)
 * No database ID in path — base URL is the full host only.
 */
export class AppFolioApiClient implements AppFolioAdapter {
  private rateLimiter: RateLimiter;
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: AppFolioApiConfig) {
    this.rateLimiter = new RateLimiter(5, 15_000);
    this.baseUrl = config.baseUrl;
    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString("base64");
    this.headers = {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      ...(config.developerId ? { "X-AppFolio-Developer-Id": config.developerId } : {}),
    };
  }

  async getVendors(): Promise<AppFolioVendor[]> {
    return this.rateLimiter.execute(async () => {
      const url = new URL(`${this.baseUrl}/api/v0/vendors`);
      // AppFolio requires at least one filter parameter on list endpoints
      url.searchParams.set("filters[LastUpdatedAtFrom]", "1970-01-01T00:00:00Z");
      const res = await fetch(url.toString(), { headers: this.headers });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`AppFolio API error: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`);
      }
      const data = await res.json();
      return this.mapVendors(data);
    });
  }

  async getUnits(propertyId?: string): Promise<AppFolioUnit[]> {
    return this.rateLimiter.execute(async () => {
      const url = new URL(`${this.baseUrl}/api/v0/units`);
      if (propertyId) {
        url.searchParams.set("filters[PropertyId]", propertyId);
      } else {
        url.searchParams.set("filters[LastUpdatedAtFrom]", "1970-01-01T00:00:00Z");
      }
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
      const url = new URL(`${this.baseUrl}/api/v0/work_orders`);
      url.searchParams.set("filters[UnitId]", unitId);
      const res = await fetch(url.toString(), { headers: this.headers });
      if (!res.ok) {
        throw new Error(`AppFolio API error: ${res.status}`);
      }
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data as Record<string, unknown[]>)["results"] ?? [];
      return items.some(
        (wo) => (wo as Record<string, unknown>)["UnitTurnCategory"] === category
      );
    });
  }

  async createWorkOrder(params: {
    unitId: string;
    category: string;
    vendorId: string;
    description: string;
  }): Promise<AppFolioWorkOrder> {
    return this.rateLimiter.execute(async () => {
      const res = await fetch(`${this.baseUrl}/api/v0/work_orders`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          UnitId: params.unitId,
          UnitTurnCategory: params.category,
          VendorId: params.vendorId || undefined,
          Description: params.description,
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
        const url = new URL(`${this.baseUrl}/api/v0/units`);
        url.searchParams.set("filters[LastUpdatedAtFrom]", "1970-01-01T00:00:00Z");
        url.searchParams.set("page[size]", "1");
        const res = await fetch(url.toString(), { headers: this.headers });
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

  private mapVendors(data: unknown): AppFolioVendor[] {
    const items: unknown[] = Array.isArray(data) ? data : (data as Record<string, unknown[]>)["results"] ?? [];
    return items.map((v: unknown) => {
      const vendor = v as Record<string, unknown>;
      return {
        id: String(vendor["Id"] ?? ""),
        name: String(vendor["Name"] ?? vendor["CompanyName"] ?? ""),
      };
    });
  }

  private mapUnits(data: unknown): AppFolioUnit[] {
    const items: unknown[] = Array.isArray(data) ? data : (data as Record<string, unknown[]>)["results"] ?? [];
    return items.map((u: unknown) => {
      const unit = u as Record<string, unknown>;
      return {
        id: String(unit["Id"] ?? ""),
        propertyId: String(unit["PropertyId"] ?? ""),
        unitName: String(unit["Name"] ?? unit["UnitName"] ?? ""),
        address: String(unit["Address"] ?? ""),
        status: String(unit["Status"] ?? ""),
      };
    });
  }

  private mapWorkOrder(data: Record<string, unknown>): AppFolioWorkOrder {
    return {
      id: String(data["Id"] ?? ""),
      unitId: String(data["UnitId"] ?? ""),
      category: String(data["UnitTurnCategory"] ?? ""),
      vendorId: String(data["VendorId"] ?? ""),
      vendorName: String(data["VendorName"] ?? ""),
      description: String(data["Description"] ?? ""),
      status: String(data["Status"] ?? ""),
      createdAt: String(data["CreatedAt"] ?? ""),
    };
  }
}
