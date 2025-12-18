export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | '';
}

export interface VendorItem {
    _id: string;
    name: string;
    shopName: string;
    contactNumber: string;
    email: string;
    address: string;
    products: string[] | any[];
    isActive: boolean;
    notes?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface VendorApiResponse {
    data: any;
    status?: string;
    totalRecords: number;
}

export interface State {
    page: number;
    pageSize: number;
    searchTerm: string;
    sortColumn: string;
    sortDirection: string;
    startIndex: number;
    endIndex: number;
    totalRecords: number;
}

export interface SearchResult {
    data: VendorItem[];
    total: number;
}

export interface VendorAddress {
  type: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}