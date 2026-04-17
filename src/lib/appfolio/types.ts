export interface AppFolioUnit {
  id: string;
  propertyId: string;
  unitName: string;
  address: string;
  status: string;
}

export interface AppFolioWorkOrder {
  id: string;
  unitId: string;
  category: string;
  vendorId: string;
  vendorName: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface AppFolioPurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  workOrderIds: string[];
  amount: number;
  status: string;
  createdAt: string;
}

export interface AppFolioVendor {
  id: string;
  name: string;
}

export interface AppFolioApiConfig {
  baseUrl: string;       // https://api.qa.appfolio.com (sandbox) or https://api.appfolio.com (prod)
  clientId: string;
  clientSecret: string;
  developerId?: string;  // X-AppFolio-Developer-Id header
}
