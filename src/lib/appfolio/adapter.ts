import type { AppFolioUnit, AppFolioWorkOrder } from "./types";

/**
 * Abstract adapter interface for AppFolio operations (ENGINE-03).
 *
 * Business logic in Phases 3-5 ONLY imports this interface — never the API client
 * or browser automation directly. Implementations are swappable without touching
 * any calling code.
 */
export interface AppFolioAdapter {
  /** Fetch units from AppFolio. Returns all units or filtered by property. */
  getUnits(propertyId?: string): Promise<AppFolioUnit[]>;

  /**
   * Check if a work order already exists for the given unit+category (ENGINE-02).
   * Returns true if a duplicate exists, false if it is safe to create.
   */
  checkWorkOrderExists(unitId: string, category: string): Promise<boolean>;

  /** Create a work order in AppFolio. Returns the created record. */
  createWorkOrder(params: {
    unitId: string;
    category: string;
    vendorId: string;
    description: string;
  }): Promise<AppFolioWorkOrder>;

  /** Test connectivity to AppFolio API. Returns true if reachable. */
  testConnection(): Promise<{ connected: boolean; error?: string }>;
}
