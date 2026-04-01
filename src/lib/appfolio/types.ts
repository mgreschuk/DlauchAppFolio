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

export interface AppFolioApiConfig {
  baseUrl: string;       // https://api.appfolio.com
  clientId: string;
  clientSecret: string;
  databaseId: string;
}
